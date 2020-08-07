# About

This repository contains source code for Ibiza iframe-based application fro Infrastructure Insights

# Team

- Program management: [Scott Kinghorn](milto:Scott.Kinghorn@microsoft.com), [David Seidman](mailto:daseidma@microsoft.com)
- Engineering: [Vitaly Filimonov](mailto:vitalyf@microsoft.com), [Nick Barnett](mailto:Nick.Barnett@microsoft.com), [Brad Bax](mailto:Brad.Bax@microsoft.com), [Ganga Mahesh Siddem](mailto:gangams@microsoft.com), [Joby Thomas](mailto:jobyt@microsoft.com)

# Questions?

Feel free to contact engineering team owners in case you have any questions about this repository or project.

# Prerequisites

1. [Visual Studio Code](https://code.visualstudio.com/) for authoring.
2. Set up Ibiza Monitoring Extension for local debugging (see instructions at the end of this doc).
3. Add path to the local folder containig the repo to your PATH evironment variable 
  (VS Code needs node.js and repo contains version tested with all processes used by the team).

Note: If you need to manage (add, upgrade) node modules used in the repository (including ones used for development only), please get approval 
from repo owners: [vitalyf](mailto:vitalyf), [nibarnet](mailto:nibarnet). Use [yarn](http://yarnpkg.com) to manage modules.

Note 2: You can use "globally-installed" version of Node.js instead of adding path to the repo folder to your PATH variable. Side effects are possible though.

# Basics

This application is a single-page purely client-side javascript app. Output contains a number of *.html files, client-side scripts compiled into 
*.js files plus there are style sheets in *.css. We use Visual Studio Code to author code, run tests and debug.

The build system is custom and is constructed around node.js (node.exe is checked into the repo for consistency). Major role in the build process is played by [webpack](https://webpack.js.org/).

# How to Access Dogfood / Production

If you try to access Infrastructure Insights internally on a Microsoft network / account you will be directed toward ms.portal.azure.com by default.  The Monitoring Extension project in ms.portal.azure.com is setup to direct 50% of traffic to MPACFlight and 50% to true production.  The MPACFlight Monitoring Extension is setup to direct traffic targetting Infrastructure Insights to inin-dogfood.azurewebsites.net (direct reflection of our develop branch).  Production Monitoring Extensions directs traffic to infrainsights-pd.azureedge.net (deployment approved reflect of our master branch; should be out of date by no more then 5 days when compared to master in practice).

You can force Ibiza and Monitoring Extension to skip this 50% by forcing one of two urls we have shortened for simplicity:
Production to Container Insights: https://aka.ms/ciprod
MPAC to Container Insights: https://aka.ms/cimpac

# EV2 Approver Access

If you need to add someone as an approver for deployments of the iFrame source code.  

1. Log into your SAW (AME optionally)
2. Open a browser and navigate to oneidentity/
3. Login with AME credentials (if you are a CorpNet SAW use InPrivate)
4. Group Name is InIn-Deploy-Approver, add appropriate AME alias

# Repo structure

The general directory structure is:

```
├── .pipelines/
|   ├── pipeline.user.windows.yml   - endor build definition file (aka.ms/cdpx)
├── .vscode/                        - shared Visual Studio Code configuration files.
├── dist/                           - auto-generated during build. Contains final build output after compilation and packaging
├── node_modules/                   - javascript packages (modules) used in the repository
├── out/                            - auto-generated during build. Contains TypeScript compiler output.
├── src/                            - source code
│   ├── scripts/                    - source scripts used in the app
│   │   ├── shared/                 - scripts shared across storage/compute areas of InfraInsights
│   │   ├── compute/                - compute-area -specific scripts
│   │   ...    			            - other folders (such as "storage") with scripts specific to those areas
│   ├── styles/                     - style sheets used in the app
│   │   ├── shared/                 - style sheets shared across storage/compute areas of InfraInsights
│   │   ├── compute/                - compute-area -specific style sheets
│   │   ...    			            - other folders (such as "storage") with style sheets specific to those areas
├── test/                           - unit test sources
├── !_README.md                     - this file
├── .gitignore                      - git config file with include/exclude file rules
├── .npmrc                          - npm config file listing custom repositories (AppInsights) used by this repo
├── authenticateNPM.cmd             - authenticates to custom npm reporitories used in the repo. Run once before getting new packages/versions from custom repo(s)
├── build.cmd                       - command line build/test/package script
├── clean.secrets.cmd               - launches clean.secrets.ps1
├── clean.secrets.ps1               - cleans files that are flaged as 'containing secrets' by the CredScan. See *) note below
├── mocha.opts                      - unit test options (settings for Mocha https://mochajs.org/)
├── node.exe                        - Node.js runtime
├── package.json                    - Project settings
├── tsconfig.json                   - TypeScript compiler settings
├── tslint.json                     - TypeScript staticd analysis tool settings
├── webpack.common.js               - WebPack (packaging tool) settings. https://webpack.github.io/
├── webpack.dev.js                  - Dev specific webpack instructions
├── webpack.prod.js                 - Production specific webpack instructions
└── yarn.lock                       - auto generated by Yarn tool.
```

*) OneBranch scans for secrets upon push to the repo. Some files within `node_modules` folder contain test secrets.
These files are cleaned up using this script. The first (and currently the only) thing it does is to remove
unit tests from certain packages (since they are not used in the repo anyways). It is a good idea to run this script
evety time you add/upgrade modules.

Note: this isn't hooked up in our build pipeline yet.  We should do this!

# Branches

- `master` branch contains codebase currently in production (or being prepared for release).
- `develop` branch contains version in development.

To contribute: create your private branch off of `develop`, make changes and use pull request to merge back to `develop`.
Pull request must be approved by at least one engineering team members.

# Authoring code

We recommend using [Visual Studio Code](https://code.visualstudio.com/) for authoring. 
If you choose to use full Visual Studio, do not commit project/solution files. The code is written in [TypeScript](https://www.typescriptlang.org/).

.vscode folder in the repo contains VS Code tasks/configurations needed to build, run & debug tests. Check with the team
when making modifications to those.

# Building code

1) Run `authenticateNPM` before `npm install` or `yarn`. You only need to do this once.
2) Run `npm install` or `yarn` to install all dependencies
3) You can build (and run tests) in the command line by running `build.cmd`.

You can start build script by clicking `Shift-Ctrl-B` in Visual Studio Code (launches `build.cmd`).

## Build output

By default both methods would compile code, run tests and package output. You can pass "notest" parameter to `build.cmd` 
if you wish to just compile TypeScript. Source code and tests (`src/**/*.ts` and `test/**/*.ts` files) are first compiled into 
`*.js` files (preserving directory structure) and are placed in the `out/` directory (this is done only for credential scanning now). 
Packaging is through webpack directly compiling (and optionally minifying the outputs if `devcompile` is not set).

The final output contains multiple bundles, one per blade, for storage performance, compute performance and maps.

# Running and debugging unit tests

We use [Mocha](https://mochajs.org/) to run unit tests. Launch VS Code, set a break point in one of the tests (under `test/` folder)
and hit `F5`. VS Code will compile typescript and unit tests will be launched under debugger and the process will break. You can step through code
or hit `F5` to continue to hit your breakpoint.

Click `Ctrl-F5` to compile and execute unit tests without debugger attached. Note: the process does not exit debugging at the end. 
Hit `Shift-F5` to end debugging session.

Script `build.cmd` executes unit tests after compilation.

# Manually testing in browser

In addition to this repository you will need to have Ibiza MonitoringExtension source code running on your local box. Refer to [MonExt docs](https://microsoft.sharepoint.com/:o:/r/teams/azureteams/aapt/azureux/portalfx/_layouts/15/WopiFrame.aspx?sourcedoc={7fd32e1d-98ec-4443-8d92-7fad5f42c48e}&action=edit&wd=target%28MonitoringUX%2Eone%7C529A9835%2DBB71%2D4924%2DADEA%2DA2C570431B31%2FGetting%20Started%7C908307DF%2D49C0%2D43FE%2DAAB4%2D3B01F1F6079E%2F%29onenote%3Ahttps%3A%2F%2Fmicrosoft%2Esharepoint%2Ecom%2Fteams%2Fazureteams%2Faapt%2Fazureux%2Fportalfx%2FSiteAssets%2FPortalFx%20Notebook%2FMonitoring%2FMonitoringUX%2Eone#Getting%20Started&section-id={529A9835-BB71-4924-ADEA-A2C570431B31}&page-id={908307DF-49C0-43FE-AAB4-3B01F1F6079E}&end) for details.

To set up InfraInsigghts for local execution, set up local IIS. Build the code in the repository
using `build.cmd` (to get `dist/` folder built). Launch IIS management tool and create virtual directory assigned
a port number 44301 pointing to the `dist/` folder (via https).

Once you have InfraInsights setup to run locally, open and edit the Monitoring Extension source code.
Open MonitoringExtension.sln
Find: Client\InfraInsights\Browse\ViewModels\Shared\InfraInsightsEnvironmentHelper.ts
At the top in the constants section, modify the LocalHostModelRootUri to utilize the port you host InfraInsights using IIS above (44301 if available).
Monitoring extension will require a recompile afterwards, but will automatically utilize this path while hosted locally.

Note: While hosted in MPAC it uses the MPACViewModelRootUri path and in production ProdViewModelRootUri.  If these are ever required to change
they would be changed here!

# Point to Dogfood Environment

To access Service Map API in INT, you need to use Dogfood Azure. Here's how you set it up:

1. Update the MonitoringExtension to point it to Azure dogfood. Edit src/MonitoringExtension/web.config and update the following two keys to the specified values:
    - Microsoft.Portal.Extensions.MonitoringExtension.ApplicationConfiguration.ArmEndpoint -> https://api-dogfood.resources.windows-int.net
    - Microsoft.P`ortal.Security.AzureActiveDirectory.AadAuthenticationConfiguration.Authority -> https://login.windows-ppe.net/
2. Restart the MonitoringExtension. This will cause it to only list subscriptions which are in use in dogfood azure and the workspaces in them
3. In the InfraInsights source, I added a file called src\scripts\shared\EnvironmentConfig.ts. All references to the ARM endpoint in the InfraInsighs source are now derived from this file. I tried to make the file detect what endpoint is being used by the MonitoringExtension, but to do this properly we need to update the contract between the MonitoringExtension and our frame and this is not done yet. However, you can edit EnvironmentConfig and replace the url it returns with https://api-dogfood.resources.windows-int.net
4. Once you rebuild and reload InfraInsights you will start using our API in INT.
5. When running Monitoring Extension in debug it will open a browser window with URI -> portal.azure.com, change this to df.onecloud.azure-test.net. Now you should see Dogfood workspaces in InfraInsights.


# Debugging with Chrome Extensions (VSCode Breakpoints)

Our build it setup to compile `devcompile` in Visual Studio code.  That means it will include inline symbol maps in the Javascript (this is also the build configuration used
to in the MPAC environment).

1. Install the `Debugger for Chrome` extension in VSCode
2. Close all Chrome windows
3. Manually launch Chrome at the command prompt: chrome.exe --remote-debugging-port=9222
4. Open the Portal and Navigate to InfraInsights
5. Click `Attach to Chrome` under the debugging window and launch debugging
6. You can now break into Typescript

Why no launch configuration?  We are hosted in an iFrame inside Ibiza. I did not investigate how to make this happen.

# A word on modules

A number of Node.js modules are used in the repo to run build, test, etc. All modules are checked into the repository
(under `node_modules`) to avoid unexpected issues during build on local or cloud box. 

Please check with the team if you want to add/upgrade modules. Use `yarn` once you received approval.

All modules are referenced by exact version number (see `package.json`) as oppose to "anything equal or greater version X" which is the default.
Upon adding a module modify package.json to change version of the module from `^x.y.z.t` to just `x.y.z.t`.

# Cloud build

## Dogfood environment

Every time pull request into `develop` branch is completed, the build is executed on the cloud box. Continuous integration
build is defined [here](https://msecg.visualstudio.com/ECG/_build/index?context=allDefinitions&path=%5CInfraInsights&definitionId=302&_a=completed).

## Production

Every pull request completed to the `master` branch will create a build artifact in MSECG.  That artifact will be made available
as a release under MSECG.  The build definition is available [here](https://msecg.visualstudio.com/ECG/_build/index?context=mine&path=%5CInfraInsights&definitionId=332&_a=completed)

When dogfood code has reached a stable point, the release should be created.  This is currently a manual process.  You will need to create a new release
based on the build created on the above pull request to `master`.  The release will need to be approved by at least one other member of the team
once it is created.  You can see the releases [here](https://msecg.visualstudio.com/ECG/_release?definitionId=35&_a=releases)

## Dogfood environment

Every continuous integration build produced by the build definition referenced above is picked up for doogfooding release. 
Dogfood environemnt is an Azure Web Application at https://inin-dogfood.azurewebsites.net/.
Dogfood release definition is located [here](https://msecg.visualstudio.com/ECG/_release?definitionId=32&_a=releases).

Dogfood also contains an ApplicationInsights instance (shared by deveelopment) for Telemetry testing.

## Production

Production is broken into a combination of an Application Insights, Storage Account (Blob) and a CDN (Verizon).  The website itself is hosted as follows:

CDN: https://infrainsights-pd.azureedge.net
Blob: https://infraorigin.blob.core.windows.net

# Subscriptions
Production Monitoring (MS Portal no JIT required): InfraInsights-Prod-Monitoring-EUS   
Production (AME Portal + JIT required): InfraInsights-Prod-EUS   
Production Live Logging Backend: InfraInsights-Prod-Root (e69ec4c5-a5a3-40ad-8881-a5148a858ea3)   

# Live Logging Backend Setup

## Traffic Manager
Resource Group: Aks-KubeApi-Proxy-Root   
Contains KeyVault for certificate & Traffic Manager Instance

## Regions (Azure Functions)
### Cca (Central Canada)
Resource Group: Aks-KubeApi-Proxy-Cca-Main   
Contains Azure Function deployment (app service + plan) and Storage Account for logs.

### Cid (Central India)
Resource Group: Aks-KubeApi-Proxy-Cid-Main   
Contains Azure Function deployment (app service + plan) and Storage Account for logs.

### Eau (East Australia)
Resource Group: Aks-KubeApi-Proxy-Eau-Main   
Contains Azure Function deployment (app service + plan) and Storage Account for logs.

### Eus (East US)
Resource Group: Aks-KubeApi-Proxy-Eus-Main   
Contains Azure Function deployment (app service + plan) and Storage Account for logs.

### Jpe (Japan East)
Resource Group: Aks-KubeApi-Proxy-Jpe-Main   
Contains Azure Function deployment (app service + plan) and Storage Account for logs.

### Sea (South East Asia)
Resource Group: Aks-KubeApi-Proxy-Sea-Main   
Contains Azure Function deployment (app service + plan) and Storage Account for logs.

### Weu (West Europe)
Resource Group: Aks-KubeApi-Proxy-Weu-Main   
Contains Azure Function deployment (app service + plan) and Storage Account for logs.

# Ibiza Monitoring Extension local setup

While InfraInsights is built as a separate web page/site it needs to be linked from somewhere in Azure Ibiza
portal in order to operate. InfraInsights is linked from Ibiza Monitoring Extension (MonExt).
If you're making changes to InfraInsights locally, you need to somehow point Azure MonExt to work
with your local copy of InfraInsights. You need to install MonExt locally, make a change, compile and run
extension locally. Below are the details on how to do that.

## Ibiza Monitoring Extension setup

Follow the steps in [Ibiza MonExt OneNote](https://microsoft.sharepoint.com/:o:/r/teams/azureteams/aapt/azureux/portalfx/_layouts/15/WopiFrame.aspx?sourcedoc={7fd32e1d-98ec-4443-8d92-7fad5f42c48e}&action=edit&wd=target%28MonitoringUX%2Eone%7C529A9835%2DBB71%2D4924%2DADEA%2DA2C570431B31%2FGetting%20Started%7C908307DF%2D49C0%2D43FE%2DAAB4%2D3B01F1F6079E%2F%29).

Note: you likely do not need to set up PortalFx (mentioned as a Pre-Req for MonExt in OneNote) unless you're planning to make changes to Ibiza framework itself.

## Monitoring Ux - Availability, Responsiveness and Exceptions : Live site

Monitoring of Ux for Availability, Responsiveness and Exceptions implemented for Container Insights Production.
Refer https://microsoft.sharepoint.com/:w:/t/Operations_Management_Suite/EXLDfQt2AchDiRjKoNscgTQBT6PK7DVgxkNcWWrIIAI0ww?e=VDTqef for more information about how and whats covered.

Using AI alerts to ICM connector, alerts are converted to IcM incidents and these are routed to Infrastructure Insights service. 
Pick Infrastructure Insights from service drop down in https://icm.ad.msft.net/imp/ManageTenants.aspx for the Connector details such as Connector Id, Name, Certificate Thumbprint etc.

If you are planning to add and modify the alerts for any functionality in Infrastructure Insights, then you need to add/modify the alerts on InfraInsightsUx-Prod resource under InfraInsightsUX-Prod-Monitoring-RG under InfraInsights-Prod-Monitoring-EUS subscription.


In short:

1. Clone repo: https://msazure.visualstudio.com/DefaultCollection/One/_git/AzureUX-Monitoring
2. Create your custom branch off of `dev` branch of the repo.
3. Launch elevated command prompt and go to repo root
4. Run init.cmd. Make sure it runs without errors. In case init.cmd does a ton of work (like it does the first time)
you'll likely need to close command prompt window and open a new one. This is not deterministic...
5. `cd src` and run `build.cmd`. Ensure there are no errors
6. Open visual studio by starting `src\MonitoringExtension.sln` in the same command prompt
7. `F5` in Visual Studio to launch MonExt web site.

At this point you should have custom MonExt running locally.
