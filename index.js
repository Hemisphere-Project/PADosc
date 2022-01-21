var easymidi = require('easymidi');
var osc = require("osc")

var playerAddr = '10.0.0.10'
// var playerAddr = '127.0.0.1'
var playerPort = 3333
var padPort = 4444

var symbol = ''

var udpPort = new osc.UDPPort({
    localAddress: "0.0.0.0",
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

function sendPing() {
    udpPort.send({
        address: "/ping"
    }, playerAddr, playerPort);
}

function sendPad(noteTuple) {
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


function openMidi() {
    var inputName
    if (process.platform == 'linux') inputName = 'nanoPAD2:nanoPAD2 nanoPAD2 _ CTRL 20:0'
    else inputName = 'nanoPAD2 PAD'

    var inputs = easymidi.getInputs();
    //console.log(inputs)
    
    if (inputs.includes(inputName)) 
    {
        input = new easymidi.Input(inputName);
        console.log(" OK")
        
        console.log('listen Player status on ', padPort)
        setInterval(sendPing, 3000)

        console.log('will send OSC to Player ',playerAddr, playerPort)
        input.on('noteon', function (msg) {
            if (notes[msg['note']][1] > 0) {
                console.log('PAD', msg['note'], ': Pi => /play Scene-'+notes[msg['note']][0]+'/0'+notes[msg['note']][1]+'-*')
                sendPad(notes[msg['note']])
            }
            else console.log('PAD', msg['note'])
        });
    }
    else setTimeout(openMidi, 2000)
}

var notes = []
for (var k=0; k<127; k++) notes[k] = [0,0]
//Top Row
//for (var k=37; k<127; k+=2) notes[k] = [Math.floor( (k-37)/16 )+1, Math.ceil((k-37)/2)%8+1 ]
// Bottom Row
for (var k=36; k<127; k+=2) notes[k] = [Math.floor( (k-36)/16 )+1, Math.ceil((k-36)/2)%8+1 ]

console.log('.:: PAD-osc ::.\n')
process.stdout.write(`Looking for nanoPAD2... `)
openMidi()