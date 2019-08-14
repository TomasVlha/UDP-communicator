const {ipcRenderer} =require('electron');
var premenna= document.getElementById('start');
var send= document.getElementById('send');
var port=document.getElementById('port');
var address=document.getElementById('address');
var message=document.getElementById('message');
var portmessage=document.getElementById('portmessage');
var addressmessage=document.getElementById('addressmessage');
var fragmentsize=document.getElementById('fragmentsize');
var file=document.getElementById("files");
var bad=document.getElementById("Damaged");
var setTYPE=document.getElementById("correct");


document.getElementById('setUDP').style.display = 'flex';
document.getElementById('setOPP').style.display = 'none';
document.getElementById('setTYPE').style.display = 'none';
document.getElementById('setSEND').style.display = 'none';

premenna.addEventListener('click',()=>{
ipcRenderer.send('startUDP',{port:port.value , address:address.value});
document.getElementById('setUDP').style.display = 'flex';
document.getElementById('setOPP').style.display = 'flex';
document.getElementById('setTYPE').style.display = 'none';
document.getElementById('setSEND').style.display = 'none';
});

setTYPE.addEventListener('click',()=>{
document.getElementById('setUDP').style.display = 'flex';
document.getElementById('setOPP').style.display = 'flex';
document.getElementById('setTYPE').style.display = 'flex';
document.getElementById('setSEND').style.display = 'flex';
});

ipcRenderer.on('TextF', (event,argument)=> {
  document.getElementById('OutputField').value =  document.getElementById('OutputField').value + argument + '\n';
});

send.addEventListener('click',()=>{
ipcRenderer.send('send',{message :message .value,portmessage:portmessage.value,addressmessage:addressmessage.value,fragmentsize:fragmentsize.value,bad:bad.checked});
});

  document.getElementById('files').addEventListener('change', function(event){
      ipcRenderer.send('readfile',{file:event.target.files[0].path});
   
  }, false);