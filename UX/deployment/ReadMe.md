
# Deployment Instructions (IFrame)
#### Helpful Links
[InfraInsights Repo](https://msazure.visualstudio.com/InfrastructureInsights/_git/UX)

[MonExt Repo](https://msazure.visualstudio.com/One/_git/AzureUX-Monitoring)

[MonExt Deployment Procedure](https://microsoft.sharepoint.com/teams/Application_Insights/DevExp/_layouts/15/WopiFrame.aspx?sourcedoc={0a2f37d2-c7c2-40ba-8176-e27c2e72fc8c}&action=edit&wd=target%28Engineering%2FCrews%2FGreen%2FMonitoring%2FMonitoringUX.one%7Cf55e0f34-2bfd-4e56-9208-984e269c143d%2FDeployment%20Hosting%20Service%20with%20EV2%7C8f2ecff0-d6c5-4a2b-97e2-87bb3a6dc3f7%2F%29&wdorigin=703)

Team | Component | Alias
--|--| --
ContainerInsights | Containers & Storage | OMSContainers
Compute | Compute & Maps |  TBD

## Dev / Master Merge (InfraInsights Repo)

1. Check with all sister teams (Compute, Containers, Storage) that a deployment is acceptable and they are ready to ensure all changes are in develop and the changes are safe to release to production.
2. Submit PR merge develop branch to master.
3. Approval usually handled by team's principal engineer.

## Production Build + Release (InfraInsights Repo)
1. Trigger a build on the official master branch
	1. Build & Release Section of VSTS
	2. Builds
	3. Pipelines Section
	4. Folder CDPX > UX >   UX-Windows-Official-master
	5. Click ... button (shows up when hovering) beside build definition
	6. Queue New Build
2. During the early stages of build, a build number will replace the initial build number.  
    1. eg: 1.0.005920001-preview-29f07ec6
3. Note this number down (but without the # hash)... 
    1. eg: 1.0.005920001-preview-29f07ec6
4. When the build is complete a release will be triggered automatically.  Observe it:
    1. Releases (no star)
    2. Find your release, it should be near the top of the list.  The pipeline should be called Compliant: InIn-UX-Prod
    3. It will be "pending" with a blue icon under Environments column, and must be approved
    4. Open the release by clicking Release-XX
    5. Click "In Progress"
    6. Click "Waiting for Approval - Succeeded" at bottom of page
    7. Copy and paste the URL from the first line
    8. Provide this URL to the approver (NOTE: Approver must have AME access)

## Testing Release Bits

1. Navigate to production portal [portal](https://portal.azure.com/?feature.customportal=false#blade/Microsoft_Azure_Monitoring/AzureMonitoringBrowseBlade/containerHealth)
2. Add additional feature flag for version override eg: &feature.insightsversion=1.0.005920001-preview-29f07ec6
3. Ensure the container insights experience functions; common error includes resource not found in blob (deployment isn't yet finished).  Confirm the version is actually loaded with chrome developer tools.

## Monitoring Extension
1. Check out the dev branch of the Monitoring Extension
2. Open AzureUX-Monitoring\src\MonitoringExtension\Client\InfraInsights\Browse\ViewModels\Shared\InfraInsightsEnvironmentHelper.ts
3. Modify the CurrentProdVersion string to your new version. 
    1. eg: 1.0.005920001-preview-29f07ec6
4. Commit and push onto a branch
5. Submit a PR to the dev branch and receive approval (usually from team's principal engineer)
6. Once merged, confirm with the Monitoring Extension release engineer today.