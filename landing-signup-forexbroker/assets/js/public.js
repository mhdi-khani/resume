var Testimonial = new Swiper('.swiper-testimonial', {
    watchSlidesVisibility: true,
    watchSlidesProgress: true,
    setWrapperSize: true,
    breakpoints: {
        0: {
            slidesPerView: 1,
            spaceBetween: 24,
        },
        576: {
            slidesPerView: 2,
            spaceBetween: 24,
        },
        992: {
            slidesPerView: 3,
            spaceBetween: 24,
        }
    },
    pagination: {
        el: '.pagination-testimonial',
        clickable: true
    },
});


$(function() {
    var Accordion = function(el, multiple) {
        this.el = el || {};
        // more then one sub-menu open?
        this.multiple = multiple || false;

        var dropdownlink = this.el.find('.dropdownlink');
        dropdownlink.on('click',
            { el: this.el, multiple: this.multiple },
            this.dropdown);
    };

    Accordion.prototype.dropdown = function(e) {
        var $el = e.data.el,
            $this = $(this),
            //this is the ul.sub-menuItems
            $next = $this.next();

        $next.slideToggle();
        $this.parent().toggleClass('active');

        if(!e.data.multiple) {
            //show only one menu at the same time
            $el.find('.sub-menu').not($next).slideUp().parent().removeClass('active');
        }

    }

    var accordion = new Accordion($('.accordion-menu'), false);
})


$('.btn-menu').click(function (){
    $(this).find('i').toggle()
    $(this).parent().find('nav').toggleClass('max-lg:hidden')
})




$('[data-countdown]').each(function() {
    var $this = $(this), finalDate = $(this).data('countdown');
    $this.countdown(finalDate, function(event) {
        var $this = $(this).html(event.strftime(''
            + '<li class="time"><b>%S</b>ثانیه</li>  '
            + '<li class="time-dots">:</li>  '
            + '<li class="time"><b>%M</b>دقیقه</li>  '
            + '<li class="time-dots">:</li>  '
            + '<li class="time"><b>%H</b>ساعت</li>  '
            + '<li class="time-dots">:</li>  '
            + '<li class="time"><b>%D</b>روز</li>  '
        ));
    }).on('finish.countdown',function (){
        $('#timer-not-complete').hide()
        $('#timer-complete-text').hide()
        $('#timer-complete').show()
        $('#timer-not-complete-text').show()
    });

});

$('.modal .icon-close').click(function (){
    $('.modal').fadeOut()
})


$(document).ready(function(){
    $(".link-scroll").on('click', function(event) {
        event.preventDefault();
        var hash = this.hash;
        $('html, body').animate({
            scrollTop: $(hash).offset().top
        }, 1000, function(){
            window.location.hash = hash;
        });
    });
})



function validatePhone(txtPhone,idAlert) {
    var a = document.getElementById(txtPhone).value;
    var b = document.querySelector(`#${idAlert}`);
    var regex = new RegExp('^(\\+98|0)?9\\d{9}$');
    if (regex.test(a)) {
        b.classList.add('hidden')
    }
    else {
        b.classList.remove('hidden')
    }
}
$('#input-call').on('keyup',function (){
    validatePhone('input-call','alert-call')
})
