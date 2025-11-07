(async function(){
const video = document.getElementById('video');
const snap = document.getElementById('snap');
const result = document.getElementById('result');


// request webcam
const stream = await navigator.mediaDevices.getUserMedia({video:true});
video.srcObject = stream;


function captureImage(){
const canvas = document.createElement('canvas');
canvas.width = video.videoWidth || 640;
canvas.height = video.videoHeight || 480;
const ctx = canvas.getContext('2d');
ctx.drawImage(video,0,0,canvas.width,canvas.height);
return canvas.toDataURL('image/jpeg');
}


snap.addEventListener('click', async ()=>{
result.innerText = 'Processing...';
const dataUrl = captureImage();
const resp = await fetch('/recognize', {
method:'POST', headers:{'Content-Type':'application/json'},
body: JSON.stringify({image: dataUrl})
});
const j = await resp.json();
if(!j.ok){ result.innerText = 'Error: ' + (j.error || 'unknown'); return; }
if(!j.recognized){ result.innerText = 'Unknown face'; return; }
// show welcome and image
result.innerHTML = `<h3>${j.message}</h3>` + (j.image_url? `<img src='${j.image_url}' width='150'/>` : '');
});
})();