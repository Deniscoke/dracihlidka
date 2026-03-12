// DH character data matching DH-LITE classes
var DH_CLASSES = [
  { name:'Válečník',   class:'Válečník',   race:'Člověk',   gender:'Muž',  img:'class-valecnik.png',  theme:'purple' },
  { name:'Kouzelník',  class:'Kouzelník',  race:'Elf',      gender:'Muž',  img:'class-kouzelnik.png',  theme:'gold'   },
  { name:'Hraničář',   class:'Hraničář',   race:'Člověk',   gender:'Muž',  img:'class-hranicar.png',  theme:'green'  },
  { name:'Alchymista', class:'Alchymista', race:'Trpaslík', gender:'Muž',  img:'class-alchymista.png',  theme:'purple' },
  { name:'Zloděj',     class:'Zloděj',     race:'Půlčík',   gender:'Muž',  img:'class-zlodej.png',  theme:'green'  },
  { name:'Klerik',     class:'Klerik',     race:'Člověk',   gender:'Žena', img:'class-klerik.png',  theme:'gold'   },
];

jQuery(document).ready(function () {

  // Assign theme classes before slick init
  jQuery('.banner-section-loop').each(function(i) {
    var theme = DH_CLASSES[i] ? DH_CLASSES[i].theme : 'purple';
    if (theme === 'gold')   jQuery(this).addClass('banner-loop-gold');
    if (theme === 'green')  jQuery(this).addClass('banner-loop-green');
    if (theme === 'purple') jQuery(this).addClass('banner-loop-purple');
  });

  // Main slider
  jQuery('.banner-section-inner').slick({
    infinite: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    dots: false,
    fade: true,
    speed: 700,
    asNavFor: '.controller-right-icons-inner',
    touchThreshold: 80,
  });

  // Side icon slider (vertical look)
  jQuery('.controller-right-icons-inner').slick({
    slidesToShow: 6,
    slidesToScroll: 1,
    asNavFor: '.banner-section-inner',
    arrows: false,
    dots: false,
    focusOnSelect: true,
    vertical: true,
    verticalSwiping: true,
  });

  // Update header colour on slide change
  function updateHeader(idx) {
    var theme = DH_CLASSES[idx] ? DH_CLASSES[idx].theme : 'purple';
    jQuery('.header-section-main')
      .removeClass('hdr-gold hdr-green hdr-purple')
      .addClass(theme === 'gold' ? 'hdr-gold' : theme === 'green' ? 'hdr-green' : '');
  }

  jQuery('.banner-section-inner').on('afterChange', function(e, slick, cur) {
    updateHeader(cur % DH_CLASSES.length);
    // re-trigger character-entrance animation
    jQuery('.banner-section-inner .slick-current .char-img')
      .css('opacity', 0).animate({ opacity: 1 }, 600);
  });
  updateHeader(0);

  // Custom cursor
  var $cursor = jQuery('.cursor');
  var mx = 0, my = 0;
  if ($cursor.length) {
    gsap.to({}, 0.016, {
      repeat: -1,
      onRepeat: function() { gsap.set($cursor[0], { left: mx, top: my }); }
    });
    window.addEventListener('mousemove', function(e) { mx = e.clientX; my = e.clientY; });
    jQuery('.cursor-scale').on('mousemove', function() {
      $cursor.addClass(jQuery(this).hasClass('small') ? 'grow-small' : 'grow');
    }).on('mouseleave', function() { $cursor.removeClass('grow grow-small'); });
  }

  // "Zvolit" buttons → postMessage to Next.js parent
  jQuery('.select-btn').on('click', function() {
    var idx = parseInt(jQuery(this).data('idx'), 10);
    var ch  = DH_CLASSES[idx] || DH_CLASSES[0];
    window.parent.postMessage({ type: 'SELECT_CHARACTER', payload: ch }, '*');
  });

  // Also make side icon clicks navigate slider
  jQuery('.icon-item').on('click', function() {
    var idx = jQuery(this).closest('.slick-slide').data('slick-index');
    jQuery('.banner-section-inner').slick('slickGoTo', idx);
  });

});
