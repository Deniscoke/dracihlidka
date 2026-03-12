jQuery(document).ready(function () {

  // Parallax on character images
  var scene = document.querySelectorAll(".scene");
  scene.forEach(function (el) {
    var parallax = new Parallax(el);
  });

  // Main banner slider
  jQuery('.banner-section-inner').slick({
    infinite: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    dots: false,
    fade: true,
    speed: 600,
    asNavFor: '.controller-right-icons-inner',
    touchThreshold: 100,
  });

  // Side icon nav slider
  jQuery('.controller-right-icons-inner').slick({
    slidesToShow: 5,
    slidesToScroll: 1,
    asNavFor: '.banner-section-inner',
    arrows: false,
    dots: false,
    focusOnSelect: true,
    variableWidth: true,
    vertical: true,
    verticalSwiping: true,
  });

  // Assign theme classes based on slide index
  function onLoadTest() {
    jQuery(".banner-section-loop").each(function (i) {
      var j = i + 1;
      if (j % 3 === 1) {
        jQuery(this).addClass("banner-loop-one");
      } else if (j % 3 === 2) {
        jQuery(this).addClass("banner-loop-second");
      } else {
        jQuery(this).addClass("banner-loop-third");
      }
    });
  }
  window.onload = onLoadTest();

  function updateHeaderTheme() {
    if (jQuery(".banner-loop-one").hasClass('slick-current')) {
      jQuery(".header-section-main")
        .removeClass("header-section-orange header-section-green")
        .addClass("header-section-blue");
    } else if (jQuery(".banner-loop-second").hasClass('slick-current')) {
      jQuery(".header-section-main")
        .removeClass("header-section-blue header-section-green")
        .addClass("header-section-orange");
    } else if (jQuery(".banner-loop-third").hasClass('slick-current')) {
      jQuery(".header-section-main")
        .removeClass("header-section-blue header-section-orange")
        .addClass("header-section-green");
    } else {
      jQuery(".header-section-main")
        .removeClass("header-section-blue header-section-orange header-section-green");
    }
  }

  jQuery('.banner-section-inner').on('afterChange', function (event, slick, currentSlide) {
    updateHeaderTheme();
    jQuery(".banner-main-img .main-img").removeClass("character-animation");
    setTimeout(function () {
      jQuery(".banner-main-img .main-img").addClass("character-animation");
    }, 50);
  });

  // Custom cursor
  var cursor = document.querySelector('.cursor');
  var cursorScaleEls = document.querySelectorAll('.cursor-scale');
  var mouseX = 0;
  var mouseY = 0;

  if (cursor) {
    gsap.to({}, 0.016, {
      repeat: -1,
      onRepeat: function () {
        gsap.set(cursor, {
          css: { left: mouseX, top: mouseY }
        });
      }
    });
    window.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });
    cursorScaleEls.forEach(function (link) {
      link.addEventListener('mousemove', function () {
        cursor.classList.add('grow');
        if (link.classList.contains('small')) {
          cursor.classList.remove('grow');
          cursor.classList.add('grow-small');
        }
      });
      link.addEventListener('mouseleave', function () {
        cursor.classList.remove('grow');
        cursor.classList.remove('grow-small');
      });
    });
  }

  // "Zvolit postavu" buttons — send message to parent frame
  document.querySelectorAll('[id^="select-char-btn-"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var slideIndex = parseInt(btn.id.replace('select-char-btn-', ''), 10) - 1;
      var characters = [
        { name: 'Válečník',  class: 'Bojovník',    race: 'Člověk' },
        { name: 'Čaroděj',  class: 'Kouzelník',   race: 'Elf' },
        { name: 'Hraničář', class: 'Průzkumník',  race: 'Člověk' },
        { name: 'Mudrc',    class: 'Alchymista',  race: 'Trpaslík' },
        { name: 'Kněz',     class: 'Duchovní',    race: 'Člověk' },
        { name: 'Zloděj',   class: 'Podvodník',   race: 'Půlčík' },
      ];
      var selected = characters[slideIndex] || characters[0];
      // Post message to parent (Next.js app)
      window.parent.postMessage({ type: 'SELECT_CHARACTER', payload: selected }, '*');
    });
  });

});
