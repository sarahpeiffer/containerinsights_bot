// MDM Custom metrics availability regions. This will be used to figure out if we need to make queries to MDM
// Link to public doc for supported regions
// https://docs.microsoft.com/en-us/azure/azure-monitor/platform/metrics-custom-overview#supported-regions
export const MdmCustomMetricAvailabilityLocations: string[] = [
    // US
    'eastus',
    'northcentralus',
    'southcentralus',
    'westcentralus',
    'westus2',
    'eastus2',
    'centralus',
    'canadacentral',
    // Europe
    'uksouth',
    'francecentral',
    'northeurope',
    'westeurope',
    // Africa
    'southafricanorth',
    // Asia
    'southeastasia',
    'eastasia',
    'centralindia',
    'japaneast',
    'koreacentral',
    // Australia
    'australiaeast'
];
