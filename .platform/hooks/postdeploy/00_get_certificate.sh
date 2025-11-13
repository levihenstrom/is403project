#!/usr/bin/env bash
# Place in .platform/hooks/postdeploy directory
sudo certbot -n -d slopesense.is404.net --nginx --agree-tos --email lhenstro@byu.edu