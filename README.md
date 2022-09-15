# online-shop-app

## 1 Kubernetes setup

### 1.1 Create temporary namespace

```shell
$ kubectl create namespace online-shop-app
$ kubectl config set-context --current --namespace=online-shop-app
```

### 1.2 Setup enviroment

#### 1.2.1 Add helm repo's
```shell
$ helm repo add bitnami https://charts.bitnami.com/bitnami
$ helm repo add kafka-ui https://provectus.github.io/kafka-ui
$ helm repo add prometheus-community https://prometheus-community.github.io/helm-charts # (optional)
$ helm repo update
```

#### 1.2.2 Setup database
```shell
$ helm upgrade --install postgres bitnami/postgresql -f ./enviroment/helm/postgres/values.yaml --namespace online-shop-app
```

#### 1.2.3 Setup kafka
```shell
$ helm upgrade --install kafka bitnami/kafka -f ./enviroment/helm/kafka/values.yaml --namespace online-shop-app

# optional
$ helm upgrade --install kafka-ui kafka-ui/kafka-ui -f ./enviroment/helm/kafka-ui/values.yaml --namespace online-shop-app # http://kafka-ui.arch.homework/
```

#### 1.2.4 Setup config
```shell
$ helm upgrade --install config ./enviroment/helm/config --namespace online-shop-app
```

#### 1.2.5 Setup ingress-controller
```shell
$ helm upgrade --install ingress-nginx ingress-nginx --repo https://kubernetes.github.io/ingress-nginx -f ./enviroment/helm/ingress-nginx/values.yaml --namespace online-shop-app
```

#### 1.2.6 Setup propetheus-stack (optional)
```shell
helm upgrade --install prometheus-stack prometheus-community/kube-prometheus-stack -f ./enviroment/helm/prometheus-stack/values.yaml --namespace online-shop-app

# access to propetheus-stack via following links:
# - http://prometheus.arch.homework
# - http://alertmanager.arch.homework/
# - http://grafana.arch.homework
```

### 1.3 Setup application

> After starting the application, please wait a bit for the database migrations to complete.

```shell
$ helm upgrade --install api-gateway ./api-gateway/helm  --namespace online-shop-app
$ helm upgrade --install users-auth ./users-auth/helm  --namespace online-shop-app
$ helm upgrade --install order ./order/helm  --namespace online-shop-app
$ helm upgrade --install payment ./payment/helm  --namespace online-shop-app
$ helm upgrade --install stock ./stock/helm  --namespace online-shop-app
$ helm upgrade --install delivery ./delivery/helm  --namespace online-shop-app
```

### 1.4 Postman tests

```
newman run --verbose https://www.getpostman.com/collections/0362d4956854e4fa67f1 --delay-request 1000
```

### 1.5 Troubleshooting

If you have following error when installing api-gateway:

```shell
Error: UPGRADE FAILED: failed to create resource: Internal error occurred: failed calling webhook "validate.nginx.ingress.kubernetes.io": failed to call webhook: Post "https://ingress-nginx-controller-admission.users-auth-app.svc:443/networking/v1/ingresses?timeout=10s": x509: certificate is valid for minikubeCA, control-plane.minikube.internal, kubernetes.default.svc.cluster.local, kubernetes.default.svc, kubernetes.default, kubernetes, localhost, not ingress-nginx-controller-admission.users-auth-app.svc
```

You can try this:

```shell
kubectl delete -A ValidatingWebhookConfiguration ingress-nginx-admission
```
