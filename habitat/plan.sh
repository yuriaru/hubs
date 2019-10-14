pkg_name=hubs
pkg_origin=mozillareality
pkg_maintainer="Mozilla Mixed Reality <mixreality@mozilla.com>"

pkg_version="1.0.0"
pkg_license=('MPLv2')
pkg_description="Duck-powered web-based social VR."
pkg_upstream_url="https://hubs.mozilla.com/"

pkg_deps=(
    core/aws-cli # AWS cli used for run hook when uploading to S3
    core/coreutils
    core/bash
    core/node10
    core/git
)

do_build() {
  rm -rf dist
  rm -rf node_modules
  rm -rf admin/dist
  rm -rf admin/node_modules
  rm -rf results
}

do_install() {
  cp -R . "${pkg_prefix}"
}
