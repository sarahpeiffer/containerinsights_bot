# Smoke test scenarios

Container Insights is supported in multiple clouds. All the scenarios needs to be test and validate in all supported clouds.
Refer to [Validate-in-applicable-clouds](#Scenario-Applicability-For-Clouds) for details about supported clouds and test subscriptions.

## A-1. Create and onboard cluster - CLI (greenfield)

1. Create a new cluster and use a default workspace to onboard through CLI:

    a. Run cmd shell or powershell or cloudshell.

    b. Check the current azure-cli version using `az --version`.

    c. Check the latest released version from this [link](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest)

    d. Download the latest az cli from the above link if you aren't already on the latest version.

    e. Configure the cloud type appropriately as described in [Configure-cloud](#Configure-Cloud-Type)

    f. Run `az login` to sign in.

    g. Run `az account set --subscription "<SubscriptionName>"` for the susbcription you're going to create the new cluster in

    h. Run `az aks create -g <ExistingResourceGroup> -n <NewManagedClusterName> --node-count 1 --enable-addons monitoring --debug`

    i. Confirm that the deployment succeeds. ( Can take 20 mins to finish )

    j. Open AKS Blade for cluster and click 'Monitor containers' tile.

    k. Observe that data is flowing and all the tabs i.e. Cluster, Nodes, Controllers and Containers have data.

        If you see `No data for selected filters, Troubleshoot...` then wait for about 10-15 mins and try to reload this view.
        If you see `Error retrieving data. Troubleshoot...` then there was some trouble related to onboarding.
        Please report this to us with the cluster resource id and the full workspace resource id.

        Cluster resource id e.g. "/subscriptions/<SubscriptiopnId>/resourcegroups/<ResourceGroup>/providers/Microsoft.ContainerService/managedClusters/<ResourceName>"

        Workspace resource id e.g. "/subscriptions/<SubscriptionId>/resourceGroups/<ResourceGroup>/providers/Microsoft.OperationalInsights/workspaces/<workspaceName>"

    l. Delete the cluster after you're done with your testing. You can use `az aks delete -g <rgName> -n <clusterName>` to do it.

2. Use existing workspace to onboard through CLI:

    a. Run cmd shell or powershell or cloudshell

    b. Check the current azure-cli version using `az --version`.

    c. Check the latest released version from this [link](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest)

    d. Download the latest az cli from the above link if you aren't already on the latest version.

    e. Configure the cloud type appropriately as described in [Configure-cloud](#Configure-Cloud-Type)

    e. Run `az login` to sign in.

    f. Run `az account set --subscription "<SubscriptionName>"` for the susbcription in which you're going to create the cluster.

    g. Create a Log Analytics workspace in a subscription other than the one the cluster is in. Refer to the following [link](https://docs.microsoft.com/en-us/azure/log-analytics/log-analytics-quick-create-workspace)

    h. Run `az aks create -g <ExistingResourceGroup> -n <NewManagedClusterName> --node-count 3 --enable-addons monitoring --workspace-resource-id <WorkspaceResourceID> --debug`

        Workspace resource id e.g. "/subscriptions/<SubscriptionId>/resourceGroups/<ResourceGroup>/providers/Microsoft.OperationalInsights/workspaces/<workspaceName>"

    i. Confirm that the deployment succeeds. ( Can take 20 mins to finish - omsagent is enabled and logAnalyticsWorkspaceResourceID has the said workspace id )

    j. Open AKS Blade for cluster and click 'Monitor containers' tile.

    k. Observe that data is flowing and all the tabs i.e. Cluster, Nodes, Controllers and Containers have data.

        If you see `No data for selected filters, Troubleshoot...` then wait for about 10-15 mins and try to reload this view.
        If you see `Error retrieving data.Troubleshoot...` then there was some trouble related to onboarding.
        Please report this to us with the cluster resource id and the full workspace resource id.

        Cluster resource id e.g. "/subscriptions/<SubscriptiopnId>/resourcegroups/<ResourceGroup>/providers/Microsoft.ContainerService/managedClusters/<ResourceName>"

        Workspace resource id e.g. "/subscriptions/<SubscriptionId>/resourceGroups/<ResourceGroup>/providers/Microsoft.OperationalInsights/workspaces/<workspaceName>"

    l. Delete the cluster after you're done with your testing. You can use `az aks delete -g <rgName> -n <clusterName` to do it.

## A-2. Onboard existing cluster - CLI (brownfield)

1. Run cmd shell or powershell or cloudshell

2. Check the current azure-cli version using `az --version`.

3. Check the latest released version from this [link](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest)

4. Download the latest az cli from the above link if you aren't already on the latest version.

5. Configure the cloud type appropriately as described in [Configure-cloud](#Configure-Cloud-Type)

6. Run `az login` to sign in.

7. Run `az account set --subscription "AI - Ibiza - PPE -Test - 1"`.

8. Create a Log Analytics workspace in a subscription other than the one the cluster is in. Refer to the following [link](https://docs.microsoft.com/en-us/azure/log-analytics/log-analytics-quick-create-workspace)

9. Run `az aks enable-addons -a monitoring -g "InIn-CoIn-Scenario-Test" -n "coin-test-ii" --workspace-resource-id <WorkspaceResourceID>`

    Workspace resource id e.g. "/subscriptions/<SubscriptionId>/resourceGroups/<ResourceGroup>/providers/Microsoft.OperationalInsights/workspaces/<workspaceName>"

10. Confirm that the deployment succeeds. ( Can take 20 mins to finish - omsagent is enabled and logAnalyticsWorkspaceResourceID has the said workspace id )

11. Open AKS Blade for cluster and click 'Monitor containers' tile.

12. Observe that data is flowing and all the tabs i.e. Cluster, Nodes, Controllers and Containers have data.

        If you see `No data for selected filters, Troubleshoot...` then wait for about 10-15 mins and try to reload this view.
        If you see `Error retrieving data.Troubleshoot...` then there was some trouble related to onboarding.
        Please report this to us with the cluster resource id and the full workspace resource id.

        Cluster resource id e.g. "/subscriptions/<SubscriptiopnId>/resourcegroups/<ResourceGroup>/providers/Microsoft.ContainerService/managedClusters/<ResourceName>"

        Workspace resource id e.g. "/subscriptions/<SubscriptionId>/resourceGroups/<ResourceGroup>/providers/Microsoft.OperationalInsights/workspaces/<workspaceName>"

13. Offboard the cluster after you're done with your testing using `az aks disable-addons -a monitoring -g "InIn-CoIn-Scenario-Test" -n "coin-test-ii"`

14. Delete the workspace that you created in Step 8.

## A-3. Onboard existing cluster - UX (brownfield)

1. Open appropriate AKS Blade for cluster and click "Insights" tile
 For Public cloud: [AKS blade for Public Cloud](https://portal.azure.com/?feature.canmodifystamps=true&Microsoft_Azure_Monitoring=MPACFlight#@microsoft.onmicrosoft.com/resource/subscriptions/b90b0dec-9b9a-4778-a84e-4ffb73bb17f6/resourceGroups/InIn-CoIn-Scenario-Test/providers/Microsoft.ContainerService/managedClusters/coin-test-ii/overview)
 For Azure China Cloud: [AKS blade for Azure China Cloud](https://portal.azure.cn/?feature.canmodifystamps=true&Microsoft_Azure_Monitoring=green#@mcdevops.partner.onmschina.cn/resource/subscriptions/00da6c5a-8caf-47c6-ba02-4fea6c0887b0/resourceGroups/InIn-CoIn-Scenario-Test/providers/Microsoft.ContainerService/managedClusters/coin-test-ii/overview)
 For Azure US Clooud: [AKS blade for Azure US Cloud](https://portal.azure.us/?feature.canmodifystamps=true&Microsoft_Azure_Monitoring=green#@fairfaxdevops.onmicrosoft.com/resource/subscriptions/12d4f304-bcb9-435f-94f4-e05a8e954bed/resourceGroups/InIn-CoIn-Scenario-Test/providers/Microsoft.ContainerService/managedClusters/coin-test-ii/overview)

3. On the Onboarding to Container Health and Logs page, if you have an existing Log Analytics workspace in the same subscription as the cluster, select it in the drop-down list.
The list preselects the default workspace and location that the AKS container is deployed to in the subscription.

4. After you've enabled monitoring, it might take about 15 minutes before you can view operational data for the cluster.

5. Observe that data is flowing and all the tabs i.e. Cluster, Nodes, Controllers and Containers have data.

        If you see `No data for selected filters, Troubleshoot...` then wait for about 10-15 mins and try to reload this view.
        If you see `Error retrieving data.Troubleshoot...` then there was some trouble related to onboarding.
        Please report this to us with the cluster resource id and the full workspace resource id.

        Cluster resource id e.g. "/subscriptions/<SubscriptiopnId>/resourcegroups/<ResourceGroup>/providers/Microsoft.ContainerService/managedClusters/<ResourceName>"

        Workspace resource id e.g. "/subscriptions/<SubscriptionId>/resourceGroups/<ResourceGroup>/providers/Microsoft.OperationalInsights/workspaces/<workspaceName>"
6. Offboard the cluster after you're done with your testing using `az aks disable-addons -a monitoring -g "InIn-CoIn-Scenario-Test" -n "coin-test-ii"`


## B. Charts page validation

1. Open the appropriate AKS blade by copying and pasting these links in your browser.
    For Public cloud: [AKS blade for Public Cloud](https://portal.azure.com/?feature.canmodifystamps=true&Microsoft_Azure_Monitoring=MPACFlight&feature.liveMetrics=true&feature.tabLiveMetricsModel=true#@microsoft.onmicrosoft.com/resource/subscriptions/b90b0dec-9b9a-4778-a84e-4ffb73bb17f6/resourceGroups/InIn-CoIn-Scenario-Test/providers/Microsoft.ContainerService/managedClusters/coin-test-i/overview)
    For China cloud: [AKS blade for China Cloud](https://portal.azure.cn/?feature.canmodifystamps=true&Microsoft_Azure_Monitoring=green&feature.liveMetrics=true&feature.tabLiveMetricsModel=true#@mcdevops.partner.onmschina.cn/resource/subscriptions/00da6c5a-8caf-47c6-ba02-4fea6c0887b0/resourceGroups/InIn-CoIn-Scenario-Test/providers/Microsoft.ContainerService/managedClusters/coin-test-i/overview)
    For US cloud: [AKS blade for US Cloud](https://portal.azure.us/?feature.canmodifystamps=true&Microsoft_Azure_Monitoring=green#@fairfaxdevops.onmicrosoft.com/resource/subscriptions/12d4f304-bcb9-435f-94f4-e05a8e954bed/resourceGroups/InIn-CoIn-Scenario-Test/providers/Microsoft.ContainerService/managedClusters/coin-test-i/overview)

2. Then, navigate to Container Insights Single Cluster blade by clicking on the "Insights" tile.
2. Open "Insights" blade in the table-of-contents
3. Observe CPU chart (top left):

   a. Confirm default time interval selected (on the pill) is last 6 hours
   b. Confirm avg and max series are selected
   c. Confirm chart showing average cpu utilization hovering at ~50%
   d. Confirm chart showing max cpu utilization flat at 100%
   e. Switch "avg", "max" series off and "95th" series on
   f. Confirm 95th is at 100% flat entire time range
   g. Switch time range in the pills to 24hrs
   h. Confirm b) through f) again

4. Observe memory chart (top right)

   a. Select last 6 hours as time range (in the pill)
   a. Confirm avg and max series are selected
   b. Confirm avg is hovering around 15-20%
   c. Switch time range in the pills to 1hr
   d. Confirm avg is hovering around 10-20%

5. Observe node count chart (bottom left)

   a. Confirm node count at all times is: 2 for ready nodes and 1 for "not ready"
   b. Turn on "total" time series. Confirm value is 3 at all times

6. Observe active pod count chart (bottom right):

   a. Confirm running pod count is 22, unknown is 4 and pending is 2 at all times
   b. Add node filter to filter to only aks-agentpool-74663261-0 (the node with high CPU utilization)
   c. Confirm running pod count is 12, unknown is 0 and pending is 0 at all times

7. Turn on "dark theme" in portal. Confirm data on charts is visible. Confirm there is no "white theme artifacts" on the charts page.

## B (1). Charts Page (Live Metrics) validation (Not available in Fairfax)

1. Press 'Go Live (preview)' button (top left)

    a. Confirm button changes from blue to red.

2. Observe all four charts on the page

    a. Confirm updates occur to CPU chart (top left)
    b. Confirm updates occur to memory chart (top right)
    c. Confirm updates occur to node count chart (bottom left)
    d. Confirm updates occur to active pod count chart (bottom right)

3. Press 'See Historical' button (top left)

    a. Confirm updates stop occuring to all four charts.
    b. Confirm button changes from red to blue.

4. Press 'Go Live (preview)' button again.

5. Open "Nodes" tab

    a. Confirm red 'See Historical' button at top disappears.
    b. Confirm blue 'Go Live (preview)' is also no longer visible.

6. Open "Cluster" tab

    a. Confirm blue 'Go Live (preview)' button is visible.

7. Press 'Go Live (preview)' button once more.

    a. Confirm charts update as before.

8. Press 'Refresh' button (top left)

    a. Confirm charts reload and charts are no longer updating.
    b. Confirm button at the top left reads 'Go Live (preview)' and is blue.

## C. Grid page (general) validation (applies to ALL entries in _C_)
Perform the following steps and validation for cluster _coin-test-i_ in subscription _AI - Ibiza - PPE -Test - 1_ (ID: b90b0dec-9b9a-4778-a84e-4ffb73bb17f6)

1. Open appropriate cloud specific AKS Blade for the cluster
    For Public cloud: (AKS blade for Public Cloud)[https://portal.azure.com/?feature.canmodifystamps=true&Microsoft_Azure_Monitoring=MPACFlight&feature.liveMetrics=true&feature.tabLiveMetricsModel=true#@microsoft.onmicrosoft.com/resource/subscriptions/b90b0dec-9b9a-4778-a84e-4ffb73bb17f6/resourceGroups/InIn-CoIn-Scenario-Test/providers/Microsoft.ContainerService/managedClusters/coin-test-i/overview]
    For China cloud: (AKS blade for China Cloud)[https://portal.azure.cn/?feature.canmodifystamps=true&Microsoft_Azure_Monitoring=green&feature.liveMetrics=true&feature.tabLiveMetricsModel=true#@mcdevops.partner.onmschina.cn/resource/subscriptions/00da6c5a-8caf-47c6-ba02-4fea6c0887b0/resourceGroups/InIn-CoIn-Scenario-Test/providers/Microsoft.ContainerService/managedClusters/coin-test-i/overview]
    For US cloud: (AKS blade for US Cloud)[https://portal.azure.us/?feature.canmodifystamps=true&Microsoft_Azure_Monitoring=green#@fairfaxdevops.onmicrosoft.com/resource/subscriptions/12d4f304-bcb9-435f-94f4-e05a8e954bed/resourceGroups/InIn-CoIn-Scenario-Test/providers/Microsoft.ContainerService/managedClusters/coin-test-i/overview]
2. Open "Insights" blade in the table-of-contents
3. Select "Nodes" tab
4. Select feedback drop down, click "Smilie" face.  Confirm feedback panel opens and smilie is selected and ready for input
5. Select "Learn More" link.  Confirm tab opens and the link to documentation is not dead.
6. Select "Monitor Resource Group" link. Confirm new blade opens for managing the selected resource's resource group
7. Add three filters: "Service", "Node", "Namespace":
   a. Confirm its not possible to add duplicates (ie. two Service filters)
   b. Confirm its not possible to click "Add" filter again to try to make a 4th filter
8. Confirm Custom time range on time filter pill functions reasonably (ie. can not choose start before end)
9. Confirm you can show and hide the property panel (should have opened automatically)\
   a. When the property panel opens for the first time, it should load for the first row in the grid
   b. When the property panel goes from being closed to open, it should load for the currently selected row in the grid
   c. After opening the first time, if you close property panel, it should stay closed, and vice-versa
10. Confirm 10 - 20 on "controllers" and "containers" tabs

## C (1). Grid Node page validation

1. Open "Nodes" tab
2. Toggle "Metric:" to CPU if not already set:
3. Observe a grid in middle of the page:
   a. Confirm default time interval selected (on the pill) is last 6 hours
   b. Confirm max time series (only) is selected
   c. Confirm 3 nodes present starting "aks-agentpool" and one node called "unscheduled"
   d. Confirm that the grid item count at the top right of the grid reads "4 items"
   e. Confirm status Ok (green) for two and Grey (unknown) for one and Warn (orange) for "unscheduled"
   f. Confirm nodes MAX% near 100% for one, 10-20% for one, "-" for unknown
   g. Confirm nodes MAX for the 100% node is around 1000mc, 100-200mc for the second, "-" for unknown
   h. Confirm 10 containers for 100% node, 22 containers for 11% node, and 6 for unknown and 2 pods for "unscheduled"
   i. Switch from "max" to "avg"
   j. Confirm numeric columns are renamed "Avg %" and "Average"
   k. Confirm the numeric values are smaller
   m. Switch time range in the pills to 24hrs
   n. Confirm b) through f) again

4. Observe the Property Panel
    a. Confirm the Property Panel opens by default (top node selected)
    b. Confirm there is a header with an icon, the name of the node, and "Node" is displayed as the type of the resource for the row selected in the grid
    c. Confirm there is a "View live data (preview)" button near the top of the Property Panel. Click it. Confirm that a panel for "Events" crops up below, and that the panel has a green check mark icon, indicating that there were no errors retrieving the events logs data
    d. Confirm there is a "View in analytics" dropdown near the top of the Property Panel. Click it. There should be one option, "View Kubernetes event logs". Click that. Confirm Log Analytics opens, a kusto query is populated, and logs appear in the list. Close Log Analytics (top right X button)
    e. Confirm all properties in the Propety Panel, including the expandable sections, have data (not "-")
    f. Expand any expandable sections in the Property Panel and check they have data (no "No Data" or "Error retrieving data"). The "Local Disk Capacity" section should have a table; make sure the table is fully populated with values. The "Labels" section will have more properties; confirm all properties have data (not "-")

5. Expand the top node:
   a. Confirm 8 PODs appear and 10 containers (2 pods with 2 containers)
   b. Confirm "Other Processes" appear and has reasonable values (smaller then the whole node, large enough that it appears to be close to NODE - [all pods])
   c. Confirm Container count on node matches the sum of all container counts of pods
   d. Confirm container count on pods is accurate (if there are 2 containers in a pod, it should say 2)
   e. Confirm container count on a pod is always "1"
   f. Confirm currently sorted column is Avg%
   g. Click the column header for Avg% (changes sort direction)
   h. Confirm the node is sorted down now and container/pod orders are reversed inside
   i. Click the column header for each column "Name", "Status", "Average", "Containers", "Uptime"
   j. Confirm sort is functional
   k. Resort again on each column to ensure reverse sort also works

6. Toggle "Metric:" to "Memory working set" and "Memory Rss":
   a. Confirm Average column units change to "GB" from "mc"
   b. Confirm percentage has changed

7. Expand each node to find one running "hello-world-logger-app" and select "hello-world-logger-app" container
8. In the Property Panel, click on dropdown "View in analytics" and click on "View container logs". Ensure Log Analytics opens, a kusto query is populated, and logs appear in the list.
9. Close Log Analytics (top right X button)
10. Click "View live data (preview)". Check that a panel for live logs appears below the grid and the log "Hello world" is being generated every 5 seconds in the console. Close the panel (X button)
11. Collapse the node so no children are visible
12. Type into Search by name: "-0".  Confirm the list of nodes drops from 3 to 1 (the node with 100% usage)

13. Turn on "dark theme" in portal.
   a. Confirm property panel contents are visible
   b. Select "Other Processes"
   c. Confirm contents visible
   d. Confirm control panel contents are visible (percentile toggle, metrics, search by name, feedback, etc)
   e. Enter text in search box
   f. Confirm the typed text is visible

## C (2). Grid Controller page validation

1. Open "Controllers" tab
2. Toggle "Metric:" to CPU if not already set, return time filter to 6 hours, select "Max" percentile, delete all search text, and remove all pill filters
3. Observe a grid in middle of the page:
   a. Confirm default time interval selected (on the pill) is last 6 hours
   b. Confirm max time series (only) is selected
   c. Confirm 20 controllers are present
   d. Confirm that the grid item count at the top right of the grid reads "20 items"
   e. Confirm status 21 Ok (green) 4 Grey (unknown), 2 Warn (orange), numbers in MAX%/MAX/containers (no "-", except heapster-5457df8d64), greater uptime then previous test run, node "-", restarts "0" and reasonable trend line
   f. Switch from "max" to "avg"
   g. Confirm numeric columns are renamed "Avg %" and "Average"
   h. Confirm the numeric values are smaller
   i. Switch time range in the pills to 24hrs
   j. Confirm b) through f) again

4. Observe the Property Panel
    a. Confirm the Property Panel opens by default (top controller selected)
    b. Confirm there is a header with an icon, the name of the controller, and "Controller" is displayed as the type of the resource for the row selected in the grid
    c. Confirm there is a "View live data (preview)" button near the top of the Property Panel. Click it. Confirm that a panel for "Events" crops up below, and that the panel has a green check mark icon, indicating that there were no errors retrieving the events logs data
    d. Confirm there is a "View in analytics" dropdown near the top of the Property Panel. Click it. There should be one option, "View Kubernetes event logs". Click that. Confirm Log Analytics opens, a kusto query is populated, and logs appear in the list. Close Log Analytics (top right X button)
    e. Confirm all properties in the Propety Panel, including the expandable sections, have data (not "-")
    f. Expand any expandable sections in the Property Panel and check they have data (no "No Data" or "Error retrieving data")

5. Expand the "omsagent (DaemonSet)" controller:
   a. Confirm 3 PODs appear (one unknown pod with "-" metrics)
   b. Confirm Container count on node matches the sum of all container counts of pods
   c. Confirm container count on pods is accurate (if there are 2 containers in a pod, it should say 2)
   d. Confirm container count on a pod is always "1"
   e. Confirm currently sorted column is Avg%
   f. Click the column header for Avg% (changes sort direction)
   g. Confirm the node is sorted down now and container/pod orders are reversed inside
   h. Click the column header for each column "Name", "Status", "Average", "Containers", "Restarts" (Uptime is not sortable here)
   i. Confirm sort is functional
   j. Resort again on each column to ensure reverse sort also works

6. Toggle "Metric:" to "Memory working set" and "Memory Rss":
   a. Confirm Average column units change to "GB" from "mc"
   b. Confirm percentage has changed

7. Expand "hello-world-logger-app" controller and select "hello-world-logger-app" container
8. In the Property Panel, click on dropdown "View in analytics" and click on "View container logs". Ensure Log Analytics opens, a kusto query is populated, and logs appear in the list.
9. Close Log Analytics (top right X button)
10. Click "View live data (preview)". Check that a panel for live logs appears below the grid and the log "Hello world" is being generated every 5 seconds in the console. Close the panel (X button)
11. Collapse the controller so no children are visible
12. Type into Search by name: "oms".  Confirm the list of controllers is reduced to 2 controllers

13. Turn on "dark theme" in portal.
   a. Confirm property panel contents are visible
   b. Confirm control panel contents are visible (percentile toggle, metrics, search by name, feedback, etc)
   c. Enter text in search box
   d. Confirm the typed text is visible

## C (3). Grid Container page validation

1. Open "Containers" tab
2. Toggle "Metric:" to CPU if not already set, return time filter to 6 hours, select "Max" percentile, delete all search text, and remove all pill filters
3. Observe a grid in middle of the page:
   a. Confirm default time interval selected (on the pill) is last 6 hours
   b. Confirm max time series (only) is selected
   c. Confirm 39 containers are present
   d. Confirm that the grid item count at the top right of the grid reads "39 items"
   e. Confirm status 33 Ok (green) 6 Grey (unkown), numbers in MAX%/MAX/containers (no "-" except for 6 unknown containers), greater uptime then previous test run, node "-", restarts "0" and reasonable trend line
   f. Confirm Property Panel open by default (top controller selected); details are present (not "-" except "service name" which may be dash)
   g. Switch from "max" to "avg"
   h. Confirm numeric columns are renamed "Avg %" and "Average"
   i. Confirm the numeric values are smaller
   j. Switch time range in the pills to 24hrs
   k. Confirm b) through f) again
   l. Confirm currently sorted column is Avg%
   m. Click the column header for Avg% (changes sort direction)
   n. Click the column header for each column "Name", "Status", "Average", "Containers", "Restarts" (Uptime is not sortable here)
   o. Confirm sort is functional
   p. Resort again on each column to ensure reverse sort also works

5. Toggle "Metric:" to "Memory working set" and "Memory Rss":
   a. Confirm Average column units change to "GB" from "mc"
   b. Confirm percentage has changed

6. Observe the Property Panel
    a. Confirm the Property Panel opens by default (top container selected)
    b. Confirm there is a header with an icon, the name of the container, and "Container" is displayed as the type of the resource for the row selected in the grid
    c. Confirm there is a "View live data (preview)" button near the top of the Property Panel. Click it. Confirm that a panel for "Events" crops up below, and that the panel has a green check mark icon, indicating that there were no errors retrieving the events logs data
    d. Confirm there is a "View in analytics" dropdown near the top of the Property Panel. Click it. There should be one option, "View container logs". Click that. Confirm Log Analytics opens, a kusto query is populated, and logs appear in the list. Close Log Analytics (top right X button)
    e. Confirm all properties in the Propety Panel, including the expandable sections, have data (not "-")
    f. Expand any expandable sections in the Property Panel and check they have data (no "No Data" or "Error retrieving data"). The "Environment Variables" section should have a table; make sure the table is fully populated with values

7. Select the "hello-world-logger-app" container
8. In the Property Panel, click on dropdown "View in analytics" and click on "View container logs". Ensure Log Analytics opens, a kusto query is populated, and logs appear in the list.
9. Close Log Analytics (top right X button)
10. Click "View live data (preview)". Check that a panel for live logs appears below the grid and the log "Hello world" is being generated every 5 seconds in the console. Close the panel (X button)
11. Type into Search by name: "oms".  Confirm the list of containers is reduced to 4 containers

12. Turn on "dark theme" in portal.
   a. Confirm property panel contents are visible
   b. Confirm control panel contents are visible (percentile toggle, metrics, search by name, feedback, etc)
   c. Enter text in search box
   d. Confirm the typed text is visible

13. Click on container named omsagent. In the property panel that opens up if the Image Tag is "ciprod10162018-2" skip this test.
   a. Click on container named container-no-env. Under the Environment Variables section in the property panel, there should only be one entry - AZMON_COLLECT_ENV set to FALSE
   b. Click on container named cpu-stress. Under the Environment Variables section in the property panel, there should only be 10 entries

## Configure-Cloud-Type
 ### Public cloud
     If the scenario you are validating against Public cloud, verify the az cli configured for "AzureCloud" via this command `az cloud show`
     The name of the cloud should be "AzureCloud" in the o/p of `az cloud show` as pointed out in the Note above.
       `C:\windows\system32>az cloud show
        {
        "endpoints": {
            "activeDirectory": "https://login.microsoftonline.com",
            "activeDirectoryDataLakeResourceId": "https://datalake.azure.net/",
            "activeDirectoryGraphResourceId": "https://graph.windows.net/",
            "activeDirectoryResourceId": "https://management.core.windows.net/",
            "batchResourceId": "https://batch.core.windows.net/",
            "gallery": "https://gallery.azure.com/",
            "management": "https://management.core.windows.net/",
            "mediaResourceId": "https://rest.media.azure.net",
            "microsoftGraphResourceId": "https://graph.microsoft.com/",
            "resourceManager": "https://management.azure.com/",
            "sqlManagement": "https://management.core.windows.net:8443/",
            "vmImageAliasDoc": "https://raw.githubusercontent.com/Azure/azure-rest-api-specs/master/arm-compute/quickstart-templates/aliases.json"
        },
        "isActive": true,
        "name": "AzureCloud", //Note: For public cloud, this should be "AzureCloud"
        "profile": "latest",
        "suffixes": {
            "acrLoginServerEndpoint": ".azurecr.io",
            "azureDatalakeAnalyticsCatalogAndJobEndpoint": "azuredatalakeanalytics.net",
            "azureDatalakeStoreFileSystemEndpoint": "azuredatalakestore.net",
            "keyvaultDns": ".vault.azure.net",
            "sqlServerHostname": ".database.windows.net",
            "storageEndpoint": "core.windows.net"
        }
        }`
     If the name of the cloud is not configured with "AzureCloud" then you can set to the AzureCloud via this command `az cloud set --name AzureCloud`

### Azure China Cloud (aka MoonCake)
   If the scenario you are validating against Azure China Cloud, verify the az cli configured for "AzureChinaCloud" via this command `az cloud show`
     The name of the cloud should be "AzureCloud" in the o/p of `az cloud show` as pointed out in the Note above.
      `C:\windows\system32>az cloud show
        {
        "endpoints": {
            "activeDirectory": "https://login.chinacloudapi.cn",
            "activeDirectoryDataLakeResourceId": null,
            "activeDirectoryGraphResourceId": "https://graph.chinacloudapi.cn/",
            "activeDirectoryResourceId": "https://management.core.chinacloudapi.cn/",
            "batchResourceId": "https://batch.chinacloudapi.cn/",
            "gallery": "https://gallery.chinacloudapi.cn/",
            "management": "https://management.core.chinacloudapi.cn/",
            "mediaResourceId": "https://rest.media.chinacloudapi.cn",
            "microsoftGraphResourceId": "https://microsoftgraph.chinacloudapi.cn",
            "resourceManager": "https://management.chinacloudapi.cn",
            "sqlManagement": "https://management.core.chinacloudapi.cn:8443/",
            "vmImageAliasDoc": "https://raw.githubusercontent.com/Azure/azure-rest-api-specs/master/arm-compute/quickstart-templates/aliases.json"
        },
        "isActive": true,
        "name": "AzureChinaCloud", //Note: For Azure China cloud, this should be "AzureChinaCloud"
        "profile": "latest",
        "suffixes": {
            "acrLoginServerEndpoint": ".azurecr.cn",
            "azureDatalakeAnalyticsCatalogAndJobEndpoint": null,
            "azureDatalakeStoreFileSystemEndpoint": null,
            "keyvaultDns": ".vault.azure.cn",
            "sqlServerHostname": ".database.chinacloudapi.cn",
            "storageEndpoint": "core.chinacloudapi.cn"
        }
        }`
     If the name of the cloud is not configured with "AzureChinaCloud" then you can set to the AzureCloud via this command `az cloud set --name AzureChinaCloud`

### Azure US Cloud (aka Fairfax)
   If the scenario you are validating against Azure US Cloud, verify the az cli configured for "AzureUSGovernment" via this command `az cloud show`
     The name of the cloud should be "AzureUSGovernment" in the o/p of `az cloud show` as pointed out in the Note above.
      `C:\windows\system32>az cloud show
        {
        "endpoints": {
            "activeDirectory": "https://login.microsoftonline.us",
            "activeDirectoryDataLakeResourceId": null,
            "activeDirectoryGraphResourceId": "https://graph.windows.net/",
            "activeDirectoryResourceId": "https://management.core.usgovcloudapi.net/",
            "batchResourceId": "https://batch.core.usgovcloudapi.net/",
            "gallery": "https://gallery.usgovcloudapi.net/",
            "management": "https://management.core.usgovcloudapi.net/",
            "mediaResourceId": "https://rest.media.usgovcloudapi.net",
            "microsoftGraphResourceId": "https://graph.microsoft.us/",
            "ossrdbmsResourceId": "https://ossrdbms-aad.database.usgovcloudapi.net",
            "resourceManager": "https://management.usgovcloudapi.net/",
            "sqlManagement": "https://management.core.usgovcloudapi.net:8443/",
            "vmImageAliasDoc": "https://raw.githubusercontent.com/Azure/azure-rest-api-specs/master/arm-compute/quickstart-templates/aliases.json"
        },
        "isActive": true,
        "name": "AzureUSGovernment",
        "profile": "latest",
        "suffixes": {
            "acrLoginServerEndpoint": ".azurecr.us",
            "azureDatalakeAnalyticsCatalogAndJobEndpoint": null,
            "azureDatalakeStoreFileSystemEndpoint": null,
            "keyvaultDns": ".vault.usgovcloudapi.net",
            "sqlServerHostname": ".database.usgovcloudapi.net",
            "storageEndpoint": "core.usgovcloudapi.net"
            }
        }`
     If the name of the cloud is not configured with "AzureUSGovernment" then you can set to the AzureCloud via this command `az cloud set --name AzureUSGovernment`

## Scenario-Applicability-For-Clouds
  1. Azure Public Cloud    -  Azure subscription for this cloud to use is Subscription name : "AI - Ibiza - PPE -Test - 1", Subscription Id: "b90b0dec-9b9a-4778-a84e-4ffb73bb17f6"
  2. Azure China Cloud  - Azure subscription for this cloud to use is Subscription name : "AI_MoonCake_Test_Sub", Subscription Id: "00da6c5a-8caf-47c6-ba02-4fea6c0887b0"
  3. Azure US Cloud - Azure subscription for this cloud to use is Subscription name : "Azure Government Internal", Subscription Id: "12d4f304-bcb9-435f-94f4-e05a8e954bed"

## D. OMSagent release validation
1. Create oms image with the changes:

   a. Make changes in docker provider to the providers or plugins
   b. Create a bundle by following this link: https://github.com/Microsoft/Build-Docker-Provider
   c. Create your branch in OMS docker
   d. Update setup.sh to point to the right bundle (Test image: Upload the bundle to storage account and wget the sh file from this location. Real image: Update the sh bundle file appropriately)
   e. Go to hub.docker.com and under build settings use an existing build definition/create own build definition
   f. Provide the location of docker file (ci_feature)
   g. Trigger build with the desired tag name

2. Create AKS cluster with the desired version of kubernetes without container monitoring.
3. Deploy test container which is emitting some logs on this cluster (Sample yaml here:  / update the interval of logs as needed in the file. Make sure there is a container for chinese characters too)
4. Deploy the oms agent pod using the kubectl create -f omsagent.yaml command ( Make sure to update the yaml file with right values for wsid and key and other values)
5. Make sure that there are no restarts and the omsagent pods are stable.
6. Check /var/opt/microsoft/omsagent/log/omsagent.log to make sure there are no errors
7. Check /var/opt/microsoft/docker-cimprov/log/kubernetes_client_log.txt to make sure there are no errors. And all types are being queried (Pods, Nodes, Events, Services)
8. Check that the changes made are present in the agent (plugins - make sure the plugins are updated here: /opt/microsoft/omsagent/plugin, providers - check libcontainer.so creation time to match the time you built it
	/opt/microsoft/docker-provider/lib and /opt/omi/lib)

Kusto Data types:
1. Make sure Container Insights solution shows up in analytics portal/Solutions tab on workspace.

    - HeartBeat
    - Perf
    - ContainerInventory
    - ContainerLog
    - ContainerNodeInventory
    - InsightsMetrics
    - KubeEvents
    - KubeNodeInventory
    - KubePodInventory
    - KubeServices
    - KubeMonAgentEvents
