terraform {
  required_version = ">= 1.2.6, <2.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.24.0"
    }
  }

  backend "s3" {
    bucket               = "webmev-terraform"
    key                  = "frontend.state"
    region               = "us-east-2"
    workspace_key_prefix = "workspace"
  }
}

locals {
  stack       = lower(terraform.workspace)
  common_tags = {
    Name      = "${local.stack}-mev"
    Project   = "WebMEV"
    Terraform = "True"
  }
}

provider "aws" {
  region = "us-east-2"
  default_tags {
    tags = local.common_tags
  }
}

resource "aws_s3_bucket" "website" {
  bucket = var.website_hostname
}

resource "aws_s3_bucket_acl" "website" {
  bucket = aws_s3_bucket.website.id
  acl    = "public-read"
}

resource "aws_s3_bucket_policy" "website" {
  bucket = aws_s3_bucket.website.id
  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = [
          aws_s3_bucket.website.arn,
          "${aws_s3_bucket.website.arn}/*",
        ]
      },
    ]
  })
}

resource "aws_s3_bucket_website_configuration" "main" {
  bucket = aws_s3_bucket.website.bucket
  index_document {
    suffix = "index.html"
  }
}

data "aws_s3_bucket" "log" {
  bucket = "webmev-logs"
}

resource "aws_s3_bucket_logging" "website" {
  bucket        = aws_s3_bucket.website.id
  target_bucket = data.aws_s3_bucket.log.id
  target_prefix = "${local.stack}/s3/"
}

resource "aws_cloudfront_distribution" "website" {
  aliases             = [var.website_hostname]
  default_root_object = "index.html"
  enabled             = true
  is_ipv6_enabled     = true
  origin {
    domain_name = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id   = var.website_hostname
  }
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = var.website_hostname
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }
  logging_config {
    bucket = data.aws_s3_bucket.log.bucket_regional_domain_name
    prefix = "${local.stack}/cloudfront/"
  }
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  viewer_certificate {
    acm_certificate_arn      = var.https_cert_arn
    minimum_protocol_version = "TLSv1.2_2021"
    ssl_support_method       = "sni-only"
  }
}
