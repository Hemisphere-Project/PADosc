var easymidi = require('easymidi');
var osc = require("osc")

var playerAddr = '10.0.0.10'
// var playerAddr = '127.0.0.1'
var playerPort = 3333

var padPort = 4444
var padIP = '10.0.0.200'

var symbol = ''

var udpPort = new osc.UDPPort({
    localAddress: padIP,
    localPort: padPort,
    metadata: true
});
udpPort.open();

udpPort.on('message', (msg, from)=>{
    //console.log(msg)
    if(msg.address == '/status') {
        var media = msg.args[0].value
        if (media == 'None') media = 'STOP'
        if (symbol == '+') symbol = '-'
        else symbol = '+'
        console.log(symbol, 'Pi status: ', media)
    }
})

udpPort.on('error', (error) => {
    if (error.code == 'EHOSTDOWN' || error.code == 'EHOSTUNREACH' ) console.log("ERROR: Pi Player cannot be reached...");
    else console.log("An error occurred: ", error);
})

function sendPing() {
    try {
        udpPort.send({
            address: "/ping"
        }, playerAddr, playerPort);
    }
    catch(error){}
}

function sendPad(noteTuple) {
    try {
        udpPort.send({
            address: "/pad",
            args: [
                {
                    type: "i",
                    value:  noteTuple[0]
                },
                {
                    type: "i",
                    value:  noteTuple[1]
                }
            ]
        }, playerAddr, playerPort);
    }
    catch(error){}
}


function openMidi() {
    var inputName
    if (process.platform == 'linux') inputName = 'nanoPAD2:nanoPAD2 nanoPAD2 _ CTRL 20:0'
    else inputName = 'nanoPAD2 PAD'

    var inputs = easymidi.getInputs();
    //console.log(inputs)
    
    if (inputs.includes(inputName)) 
    {
        input = new easymidi.Input(inputName);
        console.log("OK")
        console.log("")
        
        console.log('listen Player status on ', padIP, padPort)
        setInterval(sendPing, 3000)

        console.log('will send OSC to Player ',playerAddr, playerPort)
        input.on('noteon', function (msg) {
            if (notes[msg['note']][1] > 0) {
                console.log('PAD', msg['note'], ': Pi => /play Scene-'+notes[msg['note']][0]+'/0'+notes[msg['note']][1]+'-*')
                sendPad(notes[msg['note']])
            }
            else console.log('PAD', msg['note'])
        });
        console.log("")
    }
    else setTimeout(openMidi, 1000)
}

var notes = []
for (var k=0; k<127; k++) notes[k] = [0,0]
//Top Row
//for (var k=37; k<127; k+=2) notes[k] = [Math.floor( (k-37)/16 )+1, Math.ceil((k-37)/2)%8+1 ]
// Bottom Row
for (var k=36; k<127; k+=2) notes[k] = [Math.floor( (k-36)/16 )+1, Math.ceil((k-36)/2)%8+1 ]

console.clear()
console.log('\n.:: PAD-osc ::.\n')

// CHECK IP
process.stdout.write('Checking network... ')
const { networkInterfaces } = require('os');
const { exit } = require('process');
const nets = networkInterfaces();
const results = []; // Or just '{}', an empty object
for (const name of Object.keys(nets)) 
    for (const net of nets[name]) 
        if (net.family === 'IPv4' && !net.internal)
            results.push(net.address);
if (!results.includes(padIP)) {
    console.log('\n\tERROR: you are not connected with static IP '+padIP)
    console.log('\n')
    exit(1)
}
else console.log('OK')

process.stdout.write(`Looking for nanoPAD2... `)
openMidi()