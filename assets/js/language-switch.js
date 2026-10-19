(function() {
  var links = document.querySelectorAll('[data-language-switch]');
  if (!links.length) return;

  var sections = document.querySelectorAll('.section-anchor[id]');
  var masthead = document.querySelector('.masthead');
  var scheduled = false;

  function updateLinks() {
    scheduled = false;
    var threshold = masthead ? masthead.getBoundingClientRect().bottom + 20 : 20;
    var hash = '';
    sections.forEach(function(section) {
      if (section.getBoundingClientRect().top <= threshold) {
        hash = '#' + encodeURIComponent(section.id);
      }
    });
    links.forEach(function(link) {
      var url = new URL(link.href);
      url.hash = hash;
      link.href = url.href;
    });
  }

  function scheduleUpdate() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(updateLinks);
  }

  // Native links also work without JavaScript; this only preserves the section.
  links.forEach(function(link) { link.addEventListener('click', updateLinks); });
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('hashchange', scheduleUpdate);
  window.addEventListener('load', scheduleUpdate);
  window.addEventListener('pageshow', scheduleUpdate);
  updateLinks();
})();
