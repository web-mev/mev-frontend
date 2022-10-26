# Deployment on AWS

## Prerequisites
* Create an HTTPS certificate for your website host name using AWS Certificate Manager in the `us-east-1` region (required by CloudFront)
* Deploy the corresponding backend version

## Operations
Create a new Terraform workspace (name should match the backend workspace name for consistency: log file prefixes, etc):
```shell
cd deployment-aws
terraform workspace new demo
```
If a workspace already exists:
```shell
terraform workspace select demo
```
Create and/or edit `terraform.tfvars`:
```shell
cp terraform.tfvars.template terraform.tfvars
```
Deploy the infrastructure:
```shell
terraform apply
```
Create a DNS record using the domain name returned by `terraform apply`:
```
<website_hostname> CNAME <cloudfront_distribution_domain_name>
```
Create and/or edit `vagrant/env.txt`:
```shell
cp vagrant/env.tmpl vagrant/env.txt
```
Build the site:
```shell
vagrant up
```
Deploy the site content:
```shell
cd dist/web-mev
aws s3 rm s3://<website_hostname> --recursive
aws s3 sync . s3://<website_hostname>
```
You may need to invalidate the CloudFront distribution to remove files from CloudFront edge cache before it expires:
```shell
aws cloudfront create-invalidation --distribution-id <id> --paths "/*"
```
Invalidation takes several minutes, to check the status:
```shell
aws cloudfront get-invalidation --distribution-id <id> --id <invalidation_id>
```
To delete the site:
```shell
cd deployment-aws
terraform destroy
```
Delete the CNAME record
