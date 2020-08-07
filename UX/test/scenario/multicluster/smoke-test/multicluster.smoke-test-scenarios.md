# Smoke test scenarios for Multi-cluster Insights

## A. Monitored clusters Grid

1.  Monitored (AKS, ARO and AKS-engine) clusters - Validate all the Navigations

    a. Launch Multi-cluster experience using below link
      For Azure Public Cloud use https://aka.ms/multi-cluster
      For Azure China  Cloud use https://aka.ms/multi-cluster-mooncake
      For Azure US Cloud use https://aka.ms/multi-cluster-fairfax

      > Note: Azure Red Hat Open Shift (ARO) supported only in Azure Public Cloud

    b. Select the subscriptions from Global Subscrition filter

    c. Validate Monitord clusters grid shows up all the Monitored (AKS, ARO and AKS-engine) Clusters

    d. Validate the Clicking on the name of the cluster

     If the selected cluster is of AKS cluster Type:  should open up the Insights Page within AKS Cluster Page
     If the selected cluster is of AKS-Engine or ARO cluster Type:  should open up the Container Insights page having selected cluster name in the title

    e. Validate all the charts and grids functionalities in Insights page

    f. Close the Insights  page after validating all the functionalities

    g. Closing the Insights  page should take the navigation back to Containers

    h. Validate Clicking on the nodes column of that cluster should take to the Nodes grid of Containers  page

    i. Validate value of TimeRange  should be Last 30 minutes and no other pills should be selected

    j. Validate Nodes grid shows up all the nodes, renders the data in grid and also the property panel

    k. Closing the Insights  page should take the navigation back to Containers

    l. Validate the Clicking on the User Pods column of that cluster should take to the Controller grid of Containers  page

    m. Validate the value of TimeRange  should be Last 30 minutes and Namespace should be <All but kube-system>

    n. Validate Controllers grid shows up all the  controllers, renders the data in grid and also the property panel

    o. Closing the Insights  page should take the navigation back to Containers

    p. Validate the Clicking on the Systen Pods column of that cluster should take to the Controller grid of Containers  page

    q. Validate the value of TimeRange  should be Last 30 minutes and Namespace should be kube-system

    r. Validate Controllers grid shows up all the  controllers, renders the data in grid and also the property panel

    s. Closing the Insights  page should take the navigation back to Containers

    t. Validate Health(preview) grid shows health information and slect rows the on tree grid and verifies health grid renders associated to the row

    u. Closing the Insights  page should take the navigation back to Containers


2.  Monitored (AKS, ARO and AKS-engine) clusters - Validate the sorting functionalities

    a. Launch Multi-cluster experience using below link
      For Azure Public Cloud use https://aka.ms/multi-cluster
      For Azure China  Cloud use https://aka.ms/multi-cluster-mooncake
      For Azure US Cloud use https://aka.ms/multi-cluster-fairfax

    b. Select the subscriptions from Global Subscrition filter

    c. Validate Monoitord clusters grid shows up all the Monitored (AKS, ARO and AKS-engine) Clusters

    d. sort (asc or desc) the CLUSTER NAME column and validate the sorting works as expected

    d. sort (asc or desc) the VERSION column and validate the sorting works as expected
      > Note: For ARO, VERSION column shows the version of the Open Shift but all other cluster types this will be Kubernetes version

    e. sort (asc or desc) the STATUS column and validate the sorting works as below

       sort order  should be Critical, Warning, UnAuthorized, NotFound,MisConfigured, Error, NoData, Unknown, Healthy if sort order is descending
       sort order  should be Healthy, Unknown, NoData, Error, MisConfigured, UnAuthorized, Warning and Critical Healthy if sort order is ascending

       Note: all these statuses UnAuthorized, NotFound,MisConfigured, Error, NoData, Unknown have same icon (?)

    f. All these statuses UnAuthorized, NotFound,MisConfigured, Error and NoData should have info icon and actionable message

    g. validate the sorting functionalities of NODES, USER PODS and SYSTEM PODS column

       Note: These columns sorted based on the node health ratio

 3.  Monitored (AKS, ARO and AKS-engine) clusters - Validate the Cluster, NODES, USER PODS and SYSTEM PODS STATUS functionality

        a. Launch Multi-cluster experience using below link
          For Azure Public Cloud use https://aka.ms/multi-cluster
          For Azure China Cloud use https://aka.ms/multi-cluster-mooncake
          For Azure US Cloud use https://aka.ms/multi-cluster-fairfax

        b. Select the subscriptions from Global Subscrition filter

        c. Validate Monoitord clusters grid shows up all the Monitored (AKS and AKS-engine) Clusters

        d. NODES STATUS

        | Overall Nodes Health Ratio | Health Status                           |
        | ---------------------------| --------------------------------------- |
        | > 0.85                     | Healthy                                 |
        | <= 0.85 and > 0.60         | Warning                                 |
        | < 0.60                     | Critical                                |
        | see conditions             | Unknown (note: display should be -/-)   |

        Conditions: NODES status will be unknown in any of the following conditions
            # 1: No data reported in last 30 minutes
            # 2: User doesn't have access to the reported Log Analytics workspace
            # 3: Reported workspace doesn't have the Container Insights solution onboarded properly
            # 3: Log Analytics workspace doesn't exist any more
            # 4: Request to fetch the Failed because of the incident in Kusto or pipeline or some other reason

        e. USER PODS STATUS

            | Overall USER PODS Health Ratio | Health Status                           |
            | -------------------------------| --------------------------------------- |
            | < 0.90                         | Critical                                |
            | >= 0.90 and < 1                | Warning                                 |
            | 1                              | Healthy                                 |
            | see conditions                 | Unknown (note: display should be -/-)   |

            Conditions: User Pods status will be unknown in any of the following conditions
                # 1: Both the User Pods and System Pods Health ratio is 0
                # 2: User doesn't have access to the reported Log Analytics workspace
                # 3: Reported workspace doesn't have the Container Insights solution onboarded properly
                # 4: Log Analytics workspace doesn't exist any more
                # 5: Request to fetch the Failed because of the incident in Kusto or pipeline or some other reason

        f. SYSTEM PODS STATUS

            | Overall SYTEM PODS Health Ratio | Health Status                         |
            | -------------------------------| -------------------------------------- |
            | < 1                             | Critical                              |
            | 1                               | Healthy                               |
            | see conditions                  | Unknown (note: display should be -/-) |

            Conditions: System Pods status will be unknown in any of the following conditions
                # 1: No data reported in last 30 minutes
                # 2: User doesn't have access to the reported Log Analytics workspace
                # 3: Reported workspace doesn't have the Container Insights solution onboarded properly
                # 4: Log Analytics workspace doesn't exist any more
                # 5: Request to fetch the Failed because of the incident in Kusto or pipeline or some other reason

        g. Cluster STATUS

            Here are the rules of how the roll-up Cluster Status calculated

            # 1 : If request to fetch the data from KUSTO failed, then Cluster status will be status received from KUSTO for that request
            possible statuses are : UnAuthorized, Error, MisConfigured, NoData and Unknown

            # 2 : Overall Cluster STATUS is unknown if any of the entity (node or user pod or system pod) status is unknown (-/-

            # 3 : Overall Cluster Health Status is min of (Overall Node Health Status, Overall User Pods Health Status, Overall System Pod Health Status)

3.  Monitored Non-Azure clusters - Validate all the Navigations

    a. Launch Multi-cluster experience using below link
      For Azure Public Cloud use https://aka.ms/multi-cluster

    b. Select the subscriptions (for example: "AI-Ibiza-PPE-Test-1") from Global Subscrition filter if not selected already

    c. Select Environment drop down and select Non-Azure (Preview)

    d. Validate Monitord clusters grid shows up Kubernetes cluster with cluster type as Kubernetes, non-Azure

    e. Validate the Clicking on the name of the cluster
       It should open up the Container Insights page having selected cluster name in the title

    f. Validate all the charts and grids functionalities in Insights page

    g. Close the Insights  page after validating all the functionalities

    h. Closing the Insights  page should take the navigation back to Containers

    i. Validate Clicking on the nodes column of that cluster should take to the Nodes grid of Containers  page

    j. Validate value of TimeRange  should be Last 30 minutes and no other pills should be selected

    k. Validate Nodes grid shows up all the nodes, renders the data in grid and also the property panel

    l. Closing the Insights  page should take the navigation back to Containers

    m. Validate the Clicking on the User Pods column of that cluster should take to the Controller grid of Containers  page

    n. Validate the value of TimeRange  should be Last 30 minutes and Namespace should be <All but kube-system>

    o. Validate Controllers grid shows up all the  controllers, renders the data in grid and also the property panel

    p. Closing the Insights  page should take the navigation back to Containers

    q. Validate the Clicking on the Systen Pods column of that cluster should take to the Controller grid of Containers  page

    r. Validate the value of TimeRange  should be Last 30 minutes and Namespace should be kube-system

    s. Validate Controllers grid shows up all the  controllers, renders the data in grid and also the property panel

    t. Closing the Insights  page should take the navigation back to Containers
    > Note: Repeat the same instructions selecting Environment: All

## B. Non-Monitored Clusters Grid

1.  Non-Monitored (AKS, ARO and AKS-engine) Clusters - Validate all the Navigations

    a. Launch Multi-cluster experience using below link
      For Azure Public Cloud use https://aka.ms/multi-cluster
      For Azure China  Cloud use https://aka.ms/multi-cluster-mooncake
      For Azure US Cloud use https://aka.ms/multi-cluster-fairfax

    b. Select the subscriptions from Global Subscrition filter

    c. Validate Non-Monoitord clusters grid shows up all the Non-Monitored (AKS and AKS-engine) Clusters

    d. Validate the Clicking on the name of the cluster

      if its AKS cluster then it should open up the  overview page of the AKS cluster
      if its AKS-engine cluster then it should open up the resource group page of the AKS-engine cluster

    e. Validate cluster name in the overview matching  with selected cluster name in Non-monitored clusters grid

    f. Closing the Cluster Overview page should take the navigation back to Non-Monitored clusters grid

    g. Validate the clicking on Enable opens up the onboarding page for that cluster

    h. close the Onboarding page and click on Enable on other cluster entry, and validate opens up onboarding page

    i. switch to Monitored grid and validate the onboarding page closes

    j. Value of STATUS should be 'NotMonitored' for all the cluster entries in the Non-Monitored grid

    k. Valid the value of NODES, USER PODS and SYSTEM PODS should be '-' for all the cluster entries in Non-Monitored clusters grid


2.  Non-Monitored (AKS, ARO and AKS-engine) Clusters - Onboarding Container Insights to Selected (AKS, ARO and AKS-engine) cluster

    a. Open Multi-cluster experience  using below link
      For Azure Public Cloud use https://aka.ms/multi-cluster
      For Azure China  Cloud use https://aka.ms/multi-cluster-mooncake
      For Azure US Cloud use https://aka.ms/multi-cluster-fairfax

    b. Select the subscriptions from Global Subscrition filter

    c. Validate Non-Monoitord clusters grid shows up all the Non-Monitored (AKS and AKS-engine) Clusters

         If the AKS cluster, click on Enable should open up onboarding UI page
          1. Click on Enable with selected workspace on the Onboarding page  and validate the onboarding succeeds

          2. After successful onboarding, onboarded cluster should be moved from Non-monitored clusters grid to Monitored clusters grid

         If the selected cluster is AKS-engine, then should open the onboarding documentation

         1.If you have existing AKS-engine (or AKS-engine Kubernetes) use or create one following the instructions available publicaly

         2. Follow the instructions in onboarding documentation to enable the monitoring

    d. validate the counts on cluster status summary updated properly (for example count of Non-monitored clusters should be less than 1 before onboarding)

## C. Cluster Status Summary

     a. Open Multi-cluster experience  using below link
      For Azure Public Cloud use https://aka.ms/multi-cluster
      For Azure China  Cloud use https://aka.ms/multi-cluster-mooncake
      For Azure US Cloud use https://aka.ms/multi-cluster-fairfax

      b. Select the subscriptions from Global Subscrition filter

      c. Validate the cluster counts on the status summary matches with the grid

            Total          : should be sum of all the cluster entries in both Monitored clusters and Non-Monitored clusters grid
            Critical       : should be total number of clusters which are having Critical status
            Warning        : should be total number of clusters which are in Waning status
            AKS Healthy    : should be the total number of AKS clusters which are in Healthy status
            AKS-engine Healthy : should be the total number of AKS-engine clusters which are in Healthy status
            Non-Monitored : should be the total number of clusters which are in NotMonitored status
            Unknown : should be total number of clusters which are having status with icon ?

     d. Try selecting and unselecting the different subscriptions in Global Subscriptions filter

     e.  Validate the data in the Cluster status summary matches

Monitored Cluster:

Make sure OMS Agent and Container Insights solution onboarded successfully to the (ARO, AKS and AKS-engine) cluster.

For AKS cluster
- Non empty WORKSPACE RESOURCE ID in the properties Blade of the AKS Cluster Page indicates the agent onboarded successfully
For AKS-engine cluster
- Non-existence of the logAnalyticsWorkspaceResourceId tag on the K8s master nodes of the AKS-engine cluster
For ARO
 - There is no UI experience, but it can be checked with response of  `az openshift show -g <rgName> -n <clusterName>` command. MonitorProfile should indicate whether cluster onboarded or not.

- Container Insights solution in analytics portal/Solutions tab of the onboarded workspace indicates the solution onboarded successfully

Non-monitored Cluster:
For AKS cluster :
- If empty WORKSPACE RESOURCE ID in the properties Blade of the AKS Cluster Page indicates that specfied cluster is non-monitored
For AKS-engine cluster
- Non-existence of the logAnalyticsWorkspaceResourceId tag on the K8s master nodes of the AKS-engine cluster

Kusto Data types:
1. Make sure Container Insights solution shows up in analytics portal/Solutions tab on workspace for the Monitored clusters.

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

