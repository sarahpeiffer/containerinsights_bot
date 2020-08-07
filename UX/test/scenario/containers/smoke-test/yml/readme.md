# About

yaml files required for smoke test setup.

# hello-world-logger-app.yaml

This file defines one of the applications used in smoke testing of AzMon for Containers release (logs in live console and in Log Analytcs).
The app produces one log line reading "Hello World!" every five seconds. Note: container image is in ACR and permissions need to be given
to the cluster in case app is deployed to a different one. Refer (Grant AKS access to ACR)[https://docs.microsoft.com/en-us/azure/container-registry/container-registry-auth-aks].

To deploy the clusters in Public cloud use `kubectl create -f hello-world-logger-app.yaml` and for China cloud use `kubectl create -f hello-world-logger-app-mc.yaml`

# unscheduledPod-1c.yml, unscheduledPod-3c.yml

These deployments used to emulate unschedulable pods for the purposes of smoke testing.

# SampleLogger.yml

This file spits out a line of chinese characters and a line of english characters every second i.e. 120 logs/second

Use `kubectl create -f SampleLogger.yml` to deploy it on your cluster.

You can change the number of logs per second by updating the `sleep 1` command.
