terraform {
  # All providers: https://registry.terraform.io/browse/providers?product_intent=terraform
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }
   required_version = ">= 1.2.0"
}

provider "aws" {
  region = "us-east-2"
}

resource "aws_instance" "my_instance" {
  ami           = "ami-0b8b44ec9a8f90422"
  instance_type = "t2.micro"
  key_name      = "NewKeyE0"
  vpc_security_group_ids = [aws_security_group.my_security_group.id]

  # user_data is used to run an script after provisioning the instance
  user_data = "${file("./scripts/deployment.sh")}"
  tags = {
    Name = "NewE0Server"
  }
}

resource "aws_eip" "my_eip" {
  instance = aws_instance.my_instance.id
}

resource "aws_security_group" "my_security_group" {
  name        = "my-security-group"
  description = "Security group for SSH access"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
}

output "elastic_ip" {
  value = aws_eip.my_eip.public_ip
}

output "ssh_command" {
  value = "ssh -i ${aws_instance.my_instance.key_name}.pem ubuntu@${aws_eip.my_eip.public_ip}"
}