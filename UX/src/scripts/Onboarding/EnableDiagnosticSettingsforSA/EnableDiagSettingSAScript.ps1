#
# EnableDiagSettingSAScript.ps1
#
<# 
    .DESCRIPTION 
		Enables diagnostic settings on all the Storage accounts in the Resource group or Subscription with a given template
 
 
    .PARAMETER WorkspaceResourceId
        Workspace Resource ID that Storage accounts send data to.

    .PARAMETER SubscriptionId
        SubscriptionId where SAs are located. If not passed - all SAs under currecnt Subscription scope will be used.
        This parameter is ignored if ResourceGroupName parameter value is provided.

    .PARAMETER ResourceGroupName
        Resource Group name where SAs are located. If not passed - all SAs under Subscription scope will be used.

    .NOTES
        LASTEDIT: February 1, 2018
#>

	param(
		[Parameter(mandatory=$true)]
		[string]$WorkspaceResourceId,
        [Parameter(mandatory=$true)]
	    [string]$SubscriptionId,
        [Parameter(mandatory=$false)]
        [string]$ResourceGroupName
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
    
    $SAs = @()
	if(!$ResourceGroupName)
        { 
            # If ResourceGroupName value is not passed - select all SAs under given SubscriptionId
            $SAs = Get-AzureRmStorageAccount
        } 
        else 
        {
            # If ResourceGroupName value is passed - select all SAs under given ResourceGroupName
            $SAs = Get-AzureRmStorageAccount -ResourceGroupName $ResourceGroupName
        }
    
	$dir = (Get-Item -Path ".\" -Verbose).FullName
	$TemplateFile = $dir + '\SAtemplate.json'
	
    # Enabling diagnostic setting on each of the SAs
	Foreach ($sa in $SAs) {
			$parameters = @{}
			$parameters.Add('workspaceResourceId', $WorkspaceResourceId)
			$parameters.Add('storageAccountName', $sa.StorageAccountName)
			$parameters
        
			$deploymentName = $sa.StorageAccountName + '-' + ((Get-Date).ToUniversalTime()).ToString('MMdd-HHmm')
			New-AzureRmResourceGroupDeployment -Name $deploymentName `
								-ResourceGroupName $sa.ResourceGroupName `
								-TemplateFile $TemplateFile `
								-TemplateParameterObject $parameters `
								-Force -Verbose `
								-ErrorVariable ErrorMessages `
                                -DeploymentDebugLogLevel All

			if ($ErrorMessages) {
				Write-Output '', 'Template deployment returned the following errors:', @(@($ErrorMessages) | ForEach-Object { $_.Exception.Message.TrimEnd("`r`n") })
			}  
			
	}