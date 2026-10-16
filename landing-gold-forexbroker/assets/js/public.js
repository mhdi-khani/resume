$('.open-model , .modal .icon-close').click(function (){
    $('.modal').fadeToggle()
})

function validatePhone(txtPhone,idAlert) {
    var a = document.getElementById(txtPhone).value;
    var b = document.querySelector(`#${idAlert}`);
    var regex = new RegExp('^(\\+98|0)?9\\d{9}$');
    if (regex.test(a)) {
        b.classList.add('hidden')
        $('#call-input-group').removeClass("error")
    }
    else {
        b.classList.remove('hidden')
        $('#call-input-group').addClass("error")
    }
}
$('#i-3').on('keyup',function (){
    validatePhone('i-3','alert-call')
})
