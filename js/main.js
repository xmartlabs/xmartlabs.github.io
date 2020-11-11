function turnTargetBlankForExternalLinks() {
  var links = document.links;
  for (var i = 0, linksLength = links.length; i < linksLength; i++) {
    if (links[i].hostname != window.location.hostname && !links[i].hostname.endsWith('xmartlabs.com')) {
      links[i].target = '_blank';
      links[i].className += ' externalLink';
    }
  }
}

function showGoToTop() {
  $(window).scroll(function(){
    if ($(this).width() <= 620 && $(this).scrollTop() > 100) {
      if($('#goToTop').is(":hidden")) {
        $('#goToTop').css({display: "flex"}).hide().fadeIn();
      }
    } else {
      $('#goToTop').fadeOut();
    }
  });
}

$(document).ready(function() {
  turnTargetBlankForExternalLinks();

  if($('#goToTop').length > 0){
    showGoToTop();
  }

  $('#goToTop').click(function(){
    $("html, body").animate({ scrollTop: 0 }, 600);
    return false;
  });

  $('.nav_dropdown').click(function(event) {
    var nav_icon = $('.nav_icon');
    if (nav_icon.css('display') != 'none') { // Current display
        nav_icon.css('display', 'none');
    } else { // Hide reply form
        nav_icon.css('display', 'block');
    }

    var nav_svg = $('.nav_svg');
    if (nav_svg.css('display') != 'none') { // Current display
        nav_svg.css('display', 'none');
    } else { // Hide reply form
        nav_svg.css('display', 'flex');
    }

    var dropdown_list = $('.dropdown_list');
    if (dropdown_list.css('display') == 'flex') { // Current display
        dropdown_list.css('display', 'none');
    } else { // Hide reply form
        dropdown_list.css('display', 'flex');
    }
  });
});
