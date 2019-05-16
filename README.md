# Xmartlabs Blog
The purpose of this blog is to showcase some insight into our work and share data and tips related to the projects we tackle.
We will also keep it updated with info and news about Xmartlabs.

## Contents

* [Local setup]
* [Featured posts]

## Local setup
This blog was built using [Jekyll](https://jekyllrb.com), a simple, extendable and static site generator.
To set it up on your machine:
1. Clone the project into your machine: git clone git@github.com:xmartlabs/blog.git
2. Create your branch: `git checkout -b my-new-branch`
3. Install Ruby 2.3.0 (you can use [rbenv](https://github.com/rbenv/rbenv))
4. Install Jekyll and bundler in this Ruby version by running: `gem install jekyll bundler`
5. Go to the folder for this repository and build the site with `jekyll serve` or `jekyll serve --host=0.0.0.0` (if you want to use it from your phone or other machine)
6. Now browse to http://localhost:4000 or http://YOUR-IP:4000

## Featured posts
If you want a post to be among the 3 featured posts you need to set the following custom variables in its [front matter](https://jekyllrb.com/docs/front-matter/):
- `featured_position: 1`
These may take one of the following values:
    - `1`: it will be displayed on the left column in Desktop, the image size needs to be around 574x385px
    - `2`: it will be displayed at the top of the right column in Desktop, the image size needs to be around 706x187px
    - `3`: it will be displayed at the bottom of the right column in Desktop, the image size needs to be around 706x187px
- `featured_image: /images/my-new-post/featured.png`
Remember to place the image inside the post's folder. A different name and format can be used, just assign the correct path to the variable.

**IMPORTANT:**
If multiple posts have the same `featured_position` the newest will show on the featured section but the others won't show on the list of posts (since these are filtered to avoid repetition). **Please avoid this by deleting these variables from the post you want to replace.**
