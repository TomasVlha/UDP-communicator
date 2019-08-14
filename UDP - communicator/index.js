const {app,BrowserWindow,ipcMain} = require('electron');
const dgram = require('dgram');
var crc32 = require('buffer-crc32');
const EventEmitter = require('events');
const connection = dgram.createSocket('udp4');
const filetype = require('file-type')
var FileReader = require('filereader');
var path = require('path');
var fs = require("fs");
var FirstWindow,document;
var PORT;
var ADDRESS;
var PORT1;
var ADDRESS1;
var window;
var FS=65992;
var LiveCount=0;
var NumberOfFragments;
var online=false;
class MyEmitter extends EventEmitter {}
const eHandler = new MyEmitter();
var lastbuffer='';
var INIT=false;
var end=false;
var Hold,stop=null;
var message,Damaged;
var FinalB=new Buffer(0);
var HelpB=new Buffer(0);
var filename;
var file=false;
var UDPON=false;
var eventik;
var outputx;
var counterI=0;

function createWindow(){
    FirstWindow= new BrowserWindow({width:750, height:860});
    FirstWindow.loadURL(`file://${__dirname}/index.html`);              //funkcia na vytvorenie prvotneho okna
    FirstWindow.on('closed',()=> {
        FirstWindow=null;
    })
}


app.on('ready',createWindow);

ipcMain.on('readfile',function(e,args){
  fs.open(args.file, 'r+', function(err, fd) {
  if (err) {
      return console.error(err);
   }
   filename = path.parse(args.file).base;
   fs.readFile(fd,function(err, data){
      if (err){
        console.log(err);
      }
      file=true;
      message=Buffer.from(data);
  });
 });
});



ipcMain.on('startUDP',(event,args)=>{
    eventik=event;
    if(UDPON==false){
    UDPON=true;
  connection.on('error', (err) => {                                     //start UDP
    console.log(`connection error:\n${err.stack}`);
    connection.close();
  });


  connection.on('message', (msg, AP_s) => {
    PORT1=AP_s.port;
    ADDRESS1=AP_s.address;                                   //zlozenie spravy
    GetMessage(msg);
  });


  connection.on('listening', () => {
    var address = connection.address();                                // inicializovanie spojenia
    console.log(`server listening at ${address.address}:${address.port}`);
    online=true;
  });
  connection.bind(args.port,args.address);
    }
    else
  console.log('connection allready exists');
});



eHandler.on('init', function(CustomHead) {
  if (LiveCount<5)
  {
      connection.send(CustomHead,PORT,ADDRESS);
      stop=setTimeout(()=>{
        LiveCount++;
        eHandler.emit('init',CustomHead);
      },500);
  }
  else
  {
     stop=null;                                                         //neinicializovalo sa koniec
    connection.close();
    }
});


eHandler.on('Sending', ()=>{                 
    SendMessage(message);                                                    //podarilo sa inicializovať spojenie posielam spravu
});


ipcMain.on('send', (event,args) => {
  FinalB=Buffer.from(HelpB);
  Damaged=args.Damaged;
  clearInterval(Hold);
  LiveCount=0;
  end=false;
  if (online){
  if (!file) message=args.message;
  FS=args.fragmentsize;
  if (PORT!=args.portmessage || ADDRESS!=args.addressmessage)
    INIT=false;
  PORT=args.portmessage;
  ADDRESS=args.addressmessage;
  if ((message.length)>FS)
  {  
    if ( message.length % FS==0)
       var CountHelper=0;
    else
       var CountHelper = FS-(message.length % FS);
    NumberOfFragments=(message.length+CountHelper)/FS;
  }
  else
    NumberOfFragments=1;
  //Inicializácia
  if (INIT==false)
  {
    const CusomHead=Buffer.alloc(11);
    CusomHead.writeUInt8(0x01,0);
    CusomHead.writeUInt16BE(0x0000,1);
    eHandler.emit('init',CusomHead);
  }
  else
    eHandler.emit('Sending');
  }
  else
  console.log('Connection not initialized');
});

   eHandler.on('RSending',function(Buffer_2){                  
    if (LiveCount<5)
    {
        connection.send(Buffer_2,PORT,ADDRESS);
        stop=setTimeout(()=>{
          LiveCount++;
          eHandler.emit('RSending',Buffer_2);
        },500);
    }
    else
    {
      stop=null;
      eHandler.emit('connectionF');
    }
  });

 eHandler.on('messagebody',function(AllFragments,Buffer_1){
    LiveCount=0;
    const BHeader=Buffer_1.slice(0,11);
    if (file==true)
        BHeader.writeUInt8(0x7,0);
      else
        BHeader.writeUInt8(0x6,0);
    if (NumberOfFragments==AllFragments)
    {
       MainBuffer=Buffer.from(message.slice(FS*(AllFragments-1),(FS*(AllFragments-1))+(message.length-(FS*(AllFragments-1)))));
       BHeader.writeUInt16BE(message.length-(FS*(AllFragments-1)),1);
       BHeader.writeUInt32BE(AllFragments,3);
       BHeader.writeUInt32BE(AllFragments,7);
       if (Damaged==false)
         Buffer_1=Buffer.concat([BHeader,crc32(MainBuffer),MainBuffer]);
       else
         Buffer_1=Buffer.concat([BHeader,crc32(MainBuffer+1),MainBuffer]);
       Damaged=false;
    }
    else
    {
      MainBuffer=Buffer.from(message.slice(FS*(AllFragments-1),FS*(AllFragments)));
      BHeader.writeUInt32BE(AllFragments,3);
      BHeader.writeUInt32BE(AllFragments+1,7);
      Buffer_1=Buffer.concat([BHeader,crc32(MainBuffer),MainBuffer]);
    }
    
    eHandler.emit('RSending',Buffer_1);
 });

eHandler.on('connectionF', ()=>{
  console.log("Failed Connection\n");
});



function SendMessage(args)
{
   const BHeader=Buffer.alloc(11);
      if (file==true)
        BHeader.writeUInt8(0x7,0);
      else
        BHeader.writeUInt8(0x6,0);
  if (NumberOfFragments==1)
  {
      const BMessage=Buffer.from(args.slice(0,args.length));
      BHeader.writeUInt16BE(args.length,1);
      BHeader.writeUInt32BE(0x00000001,3);
      BHeader.writeUInt32BE(0x00000001,7);
      if (Damaged==false)
        buf=Buffer.concat([BHeader,crc32(BMessage),BMessage]);
      else
        buf=Buffer.concat([BHeader,crc32(BMessage+1),BMessage]);
      LiveCount=0;
  }
  else
  {
      const BMessage=Buffer.from(args.slice(0,FS));
      BHeader.writeUInt16BE(FS,1);
      BHeader.writeUInt32BE(0x00000001,3);
      BHeader.writeUInt32BE(0x00000002,7);
      if (Damaged==false)
        buf=Buffer.concat([BHeader,crc32(BMessage),BMessage]);
      else
        buf=Buffer.concat([BHeader,crc32(BMessage+1),BMessage]);
      LiveCount=0;
  }
  eHandler.emit('RSending',buf);
}



eHandler.on('KeepAlive',()=>{
Hold=setInterval(()=>{
      const KALbuffer=Buffer.alloc(11);
      KALbuffer.writeUInt8(0x2,0);
      KALbuffer.writeUInt16BE(0x0,1);
      connection.send(KALbuffer,PORT,ADDRESS);
      HConnection=setTimeout(()=>{
          clearInterval(Hold);
          Hold=null;
          INIT=false;
      },1000);
},10000);

});

function GetMessage(msg)
{
  const MessageBuffer=Buffer.from(msg);
  const bufheader=Buffer.alloc(11);
  var length;
  var expecting;
  var actual;
  if (MessageBuffer.readUInt8(0)==3 && MessageBuffer.readUInt16BE(1)==0)
  {
    if (stop!=null)
    {
      clearTimeout(stop);
      stop=null;
      eHandler.emit('Sending');
      INIT=true;
    }
    else
    return;
  }


  if (MessageBuffer.readInt8(0)==2 && MessageBuffer.readInt16BE(1)==0)
  {
    bufheader.writeUInt8(0x08,0);
    bufheader.writeUInt16BE(0x0000,1);
    connection.send(bufheader,PORT1,ADDRESS1);
    INIT=true;  
    return;
  }
  if (MessageBuffer.readInt8(0)==8)
  {
    if (HConnection!=null)
        {
          clearTimeout(HConnection);
          HConnection=null;
          INIT=true;
        }
    else
    return;
  }

  if (MessageBuffer.readInt8(0)==1 && MessageBuffer.readInt16BE(1)==0)
  {
    bufheader.writeUInt8(0x03,0);
    bufheader.writeUInt16BE(0x0000,1);
    connection.send(bufheader,PORT1,ADDRESS1);
    return;
  }
  if (MessageBuffer.readUInt8(0)==6 || MessageBuffer.readUInt8(0)==7)
  {
    clearInterval(Hold);  
    length=MessageBuffer.readUInt16BE(1);
    actual=MessageBuffer.readUInt32BE(3);
    expecting=MessageBuffer.readUInt32BE(7);
    const crc=MessageBuffer.slice(11,15);
    if (crc.equals(crc32(MessageBuffer.slice(15,length+15))))    
    {
      if (end==false)
      {
        lastbuffer=lastbuffer+MessageBuffer.slice(15,15+length).toString();
        FinalB=Buffer.concat([FinalB,MessageBuffer.slice(15,15+length)]);
        if (actual==expecting)
        {
          if (MessageBuffer.readUInt8(0)==7)
          {
                fs.writeFile('filename.'+filetype(FinalB).ext, FinalB, function(err) {
                if(err) {
                    console.log(err);
                } else {
                    console.log("The file was saved!");
                }
                });
          }
          else
          {
            outputx=lastbuffer;
          }
          lastbuffer='';
          end=true;
        }
      }
      MessageBuffer.writeUInt8(0x04,0);
    }
   else
   {
      MessageBuffer.writeUInt8(0x05,0);
   }
   connection.send(MessageBuffer,PORT1,ADDRESS1);
   return;
 }

 if (MessageBuffer.readInt8(0)==4)
 {
      if (stop!=null)
      {
          actual=MessageBuffer.readUInt32BE(3);
          expecting=MessageBuffer.readUInt32BE(7);
          clearTimeout(stop);
          stop=null;
          if (actual==expecting)
          {
            eventik.sender.send('TextF',outputx);
            file=0;
            eHandler.emit('KeepAlive');
             eventik.sender.send('TextF',actual + 'packet size is:' + MessageBuffer.length + ' Bajts with 15 Bajt Header');
             counterI=counterI+1;
          }
          else
          {
            eHandler.emit('messagebody',expecting,MessageBuffer);
            eventik.sender.send('TextF',actual + 'packet size is: ' + MessageBuffer.length  + ' Bajts with 15 Bajt Header');
            counterI=counterI+1;
          }
          eventik.sender.send('TextF','pocet vsetkych fragmentov:' + counterI + '\n');
      }
      else
      return;
 }
    if (MessageBuffer.readInt8(0)==5)
    {
      if (stop!=null)
      {
        actual=MessageBuffer.readUInt32BE(3);
        expecting=MessageBuffer.readUInt32BE(7);
        clearTimeout(stop);
        stop=null;
        eHandler.emit('messagebody',actual,MessageBuffer);
      }
      else
        return;
    }

}
app.on('window-all-closed',()=> {
    app.quit();
});

