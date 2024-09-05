resource "aws_s3_bucket" "website" {
  bucket        = var.website_hostname
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "website" {
  bucket = aws_s3_bucket.website.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_ownership_controls" "website" {
  bucket = aws_s3_bucket.website.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_policy" "website" {
  bucket = aws_s3_bucket.website.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource = [
          aws_s3_bucket.website.arn,
          "${aws_s3_bucket.website.arn}/*",
        ]
      },
    ]
  })
}

resource "aws_s3_bucket" "log" {
  bucket = "${local.stack}-webmev-frontend-logs"
}

resource "aws_s3_bucket_logging" "website" {
  bucket        = aws_s3_bucket.website.id
  target_bucket = aws_s3_bucket.log.id
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
    bucket = aws_s3_bucket.log.bucket_regional_domain_name
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
  # this block allows "direct" urls.
  # Without this, attempts to access {var.website_hostname}/foo
  # will generate a 404. By adding this, the angular app will
  # properly load the route associated with /foo
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }
}
