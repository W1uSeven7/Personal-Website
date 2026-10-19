/*
 * Responsive overflow navigation. Language links live outside this container.
 */
(function() {
  var $nav = $('#site-nav');
  var $btn = $nav.children('.nav-toggle');
  var $vlinks = $nav.children('.visible-links');
  var $hlinks = $nav.children('.hidden-links');

  function closeMenu() {
    $hlinks.addClass('hidden');
    $btn.removeClass('close').attr('aria-expanded', 'false');
  }

  function updateNav() {
    $vlinks.append($hlinks.children());
    $btn.addClass('hidden');
    var availableSpace = $nav.width();

    if ($vlinks.outerWidth() > availableSpace) {
      $btn.removeClass('hidden');
      availableSpace -= $btn.outerWidth() + 12;

      // Never move the site title or recurse when no more links can collapse.
      var $items = $vlinks.children(':not(.masthead__menu-item--lg)');
      while ($vlinks.outerWidth() > availableSpace && $items.length) {
        $items.last().prependTo($hlinks);
        $items = $vlinks.children(':not(.masthead__menu-item--lg)');
      }
    }

    if (!$hlinks.children().length) {
      $btn.addClass('hidden');
      closeMenu();
    }
    $btn.attr('count', $hlinks.children().length);
  }

  $btn.on('click', function() {
    var open = $hlinks.hasClass('hidden');
    $hlinks.toggleClass('hidden', !open);
    $btn.toggleClass('close', open).attr('aria-expanded', String(open));
  });

  $hlinks.on('click', 'a', closeMenu);
  $(document).on('click', function(event) {
    if (!$nav[0].contains(event.target)) closeMenu();
  });
  $(document).on('keydown', function(event) {
    if (event.key === 'Escape' && !$hlinks.hasClass('hidden')) {
      closeMenu();
      $btn.trigger('focus');
    }
  });
  $(window).on('resize', updateNav);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(updateNav);
  updateNav();
})();
