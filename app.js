const btns = document.querySelectorAll('.cartbtn')
let count = 0
btns.forEach(btn => {
    btn.addEventListener('click',()=> {
    count+=1;
    if(count>0){
        btn.innerHTML = `<button>-</button><span>${count}</span><button>+</button>`
    }
    })
})


