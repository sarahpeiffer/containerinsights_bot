# USAGE: .\InstallAgents.ps1 -WorkspaceId {WORKSPACEID} -WorkspaceKey {WORKSPACEKEY} -SubscriptionId {SUBSCRIPTIONID} -ResourceGroup {RESOURCEGROUPNAME}

param(
		[Parameter(mandatory=$true)]
		[string]$WorkspaceId,
		[Parameter(mandatory=$true)]
		[string]$WorkspaceKey,
        [Parameter(mandatory=$true)]
	    [string]$SubscriptionId,
        [Parameter(mandatory=$false)]
        [string]$ResourceGroup,
		[Parameter(mandatory=$false)]
        [boolean]$SkipManualUpgrade = $false
	)

	$account = Get-AzureRmContext
	if ($account.Account -eq $null)
	{
		Write-Output("Account Context not found, please login")
		Login-AzureRmAccount -subscriptionid $SubscriptionId
	} else 
	{
		if ($account.Subscription.Id -eq $SubscriptionId)
		{
			Write-Output("Subscription: $SubscriptionId is already selected.")
			$account
		} else
		{
			Write-Output("Current Subscription:")
			$account
			Write-Output("Changing to subscription: $SubscriptionId")
			Select-AzureRmSubscription -SubscriptionId $SubscriptionId
		}
	}

	$VMs = @()
	$failedDeployments = @()
	$ScaleSets = @()
	
	if(!$ResourceGroup)
	{ 
		# If ResourceGroup value is not passed - get all VMs under given SubscriptionId
		$VMs = Get-AzureRmVM
		$ScaleSets = Get-AzureRmVmss
		$VMs = @($VMs) + $ScaleSets
	}
	else 
    {
        # If ResourceGroup value is passed - select all VMs under given ResourceGroupName
        $VMs = Get-AzureRmVM -ResourceGroupName $ResourceGroup
		$ScaleSets = Get-AzureRmVmss -ResourceGroupName $ResourceGroup
		$VMs = @($VMs) + $ScaleSets
    }

	$MMAExtensionMap = @{ "Windows" = "MicrosoftMonitoringAgent"; "Linux" = "OmsAgentForLinux" }
	$MMAExtensionVersionMap = @{ "Windows" = "1.0"; "Linux" = "1.4" }
	$DAExtensionMap = @{ "Windows" = "DependencyAgentWindows"; "Linux" = "DependencyAgentLinux" }
	$DAExtensionVersionMap = @{ "Windows" = "9.1"; "Linux" = "9.1" }
	
	$PublicSettings = @{"workspaceId" = $WorkspaceId}
	$ProtectedSettings = @{"workspaceKey" = $WorkspaceKey}
		
	# Installing VM Extensions serially in all VMs
	Foreach ($vm in $VMs) {
		$dir = (Get-Item -Path ".\" -Verbose).FullName
		$isScaleset = $false
		if ($vm.type -eq 'Microsoft.Compute/virtualMachineScaleSets') {
			$isScaleset = $true
		}
		if ($isScaleset)
		{
			$scalesetVMs= @()
			$scalesetVMs = Get-AzureRmVMssVM -ResourceGroupName $ResourceGroup -VMScaleSetName $vm.name
			if ($scalesetVMs.length -gt 0) {
				if ($scalesetVMs[0]) {
					$osType = $scalesetVMs[0].storageprofile.osdisk.ostype
				}
			}
		}
		else {
			$osType = $vm.StorageProfile.OsDisk.OsType
		}
		
		if ($ext) { Clear-variable -Name "ext" }
		$ext = $osType.ToString()
		$mmaExt = $MMAExtensionMap.($osType.ToString())
		$mmaExtVersion = $MMAExtensionVersionMap.($osType.ToString())
		$daExt = $DAExtensionMap.($osType.ToString())
		$daExtVersion = $DAExtensionVersionMap.($osType.ToString())
			
		$name = $vm.Name
		$location = $vm.Location
		Write-Output("Deployment settings: ")
		Write-Output("ResourceGroup: $ResourceGroup")
		Write-Output("VM: $name")
		Write-Output("Location: $location")
		Write-Output("OS Type: $ext")
		Write-Output("Dependency Agent: $daExt, HandlerVersion: $daExtVersion")
		Write-Output("Monitoring Agent: $mmaExt, HandlerVersion: $mmaExtVersion")
	
		if ($ext.length -gt 0) 
		{	
			if ($isScaleset) {
				Write-Output("Deploying $daExt for VM scale set $name...")
				$scalesetObject = Get-AzureRMVMSS -ResourceGroupName $ResourceGroup -VMScaleSetName $name
				
				Write-Output("Adding DAExtension")
				$scalesetObject = Add-AzureRmVmssExtension -VirtualMachineScaleSet $scalesetObject `
										 -Name 'DAExtension' `
										 -Publisher 'Microsoft.Azure.Monitoring.DependencyAgent' `
										 -Type $daExt `
										 -TypeHandlerVersion $daExtVersion `
										 -AutoUpgradeMinorVersion $true
				Write-Output("Added DAExtension")
				Write-Output("Adding MMAExtension")
				$scalesetObject = Add-AzureRmVmssExtension -VirtualMachineScaleSet $scalesetObject `
										 -Publisher 'Microsoft.EnterpriseCloud.Monitoring' `
										 -Type $mmaExt `
										 -Name 'MMAExtension' `
										 -TypeHandlerVersion $mmaExtVersion `
										 -Setting $PublicSettings `
										 -ProtectedSetting $ProtectedSettings `
										 -AutoUpgradeMinorVersion $true
				Write-Output("Added MMAExtension")					
				
				Write-Output("Updating scale sets with extension")
				$result = Update-AzureRmVmss -ResourceGroupName $ResourceGroup -VMScaleSetName $name -VirtualMachineScaleSet $scalesetObject
				Write-Output("Scale sets updated with extension")
				
				if ($scalesetObject.UpgradePolicy.mode -eq 'Manual' -and $SkipManualUpgrade -ne $true) {
					Write-Output("Upgrading scale set instances since the upgrade policy is set to Manual")
					$scaleSetInstances = @{}
					$scaleSetInstances = Get-AzureRMVMSSvm -ResourceGroupName $ResourceGroup -VMScaleSetName $name -InstanceView
					$i = 0
					$instanceCount = $scaleSetInstances.Length
					Foreach ($scaleSetInstance in $scaleSetInstances) {
					    $i++
					    Write-Output("Updating instance:$i of $instanceCount")
						Update-AzureRmVmssInstance -ResourceGroupName $ResourceGroup -VMScaleSetName $name -InstanceId $scaleSetInstance.InstanceId
					}
					Write-Output("All scale set instances in scaleset $name upgraded")
				}
				
				$extensions = $scalesetObject.VirtualMachineProfile.ExtensionProfile.extensions
				$extensionArray = @()
				Foreach ($extension in $extensions) {
				 $extensionArray = @($extensionArray) + $extension.name
				}
				if ($extensionArray.contains('DAExtension')) {
					Write-Output("Successfully deployed $daExt.")
				}
				else {
					Write-Output("Failed to deploy $daExt.")
					Write-Output("-------------------------------")
					$failedDeployments = $failedDeployments + "$ResourceGroup : $name : $daExt"
				}
				if ($extensionArray.contains('MMAExtension')) {
					Write-Output("Successfully deployed $mmaExt.")
				}
				else {
					Write-Output("Failed to deploy $mmaExt.")
					Write-Output("-------------------------------")
					$failedDeployments = $failedDeployments + "$ResourceGroup : $name : $mmaExt"
				}
			}
				
			else {
				Write-Output("Deploying $daExt for VM $name...")
				$result = Set-AzureRmVMExtension -ResourceGroupName $ResourceGroup `
											 -VMName $name `
											 -Location $location `
											 -Publisher 'Microsoft.Azure.Monitoring.DependencyAgent' `
											 -ExtensionType $daExt `
											 -ExtensionName 'DAExtension' `
											 -TypeHandlerVersion $daExtVersion
											 
				if($result.IsSuccessStatusCode)
				{
					Write-Output("Successfully deployed $daExt.")
					Write-Output("-------------------------------")
				} 
				else 
				{
					Write-Output("Failed to deploy $daExt.")
					Write-Output("-------------------------------")
					$failedDeployments = $failedDeployments + "$ResourceGroup : $name : $daExt"
				}
				Write-Output("Deploying  $mmaExt for VM $name ...")
				$result = Set-AzureRmVMExtension -ResourceGroupName $ResourceGroup `
											 -VMName $name `
											 -Location $location `
											 -Publisher 'Microsoft.EnterpriseCloud.Monitoring' `
											 -ExtensionType $mmaExt `
											 -ExtensionName 'MMAExtension' `
											 -TypeHandlerVersion $mmaExtVersion `
											 -Settings $PublicSettings `
											 -ProtectedSettings $ProtectedSettings
													  
				if($result.IsSuccessStatusCode)
				{
					Write-Output("Successfully deployed $mmaExt.")
					Write-Output("-------------------------------")
				} else 
				{
					Write-Output("Failed to deploy $mmaExt.")
					Write-Output("-------------------------------")
					$failedDeployments = $failedDeployments + "$ResourceGroup : $name : $mmaExt"
				}
			}		
		}
		else {
			Write-Output '', 'os type not present on the vm',$vm.name
		}		
	}
		
	if ($failedDeployments -gt 0)
	{
		Write-Output("")
		Write-Output("")
		Write-Output("")
		Write-Output("Failed to deploy below agents")
		Write-Output("ResourceGroupName : VM/Scaleset Name : Agent Name")
		Write-Output("---------------------------------------------------")
		$failedDeployments
	}
	else {
		Write-Output("---------------------------------------------------")
		Write-Output("Successfully deployed agents on all VMs/Scalesets/Availability Sets")
		Write-Output("---------------------------------------------------")
	}
