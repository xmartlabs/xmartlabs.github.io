function turnTargetBlankForExternalLinks() {
  var links = document.links;
  for (var i = 0, linksLength = links.length; i < linksLength; i++) {
    if (links[i].hostname != window.location.hostname && !links[i].hostname.endsWith('xmartlabs.com')) {
      links[i].target = '_blank';
      links[i].className += ' externalLink';
    }
  }
}

$(document).ready(function() {
  turnTargetBlankForExternalLinks();
});
