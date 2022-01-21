var easymidi = require('easymidi');
var osc = require("osc")

var playerAddr = '10.0.0.10'
// var playerAddr = '127.0.0.1'
var playerPort = 3333


var udpPort = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 4444,
    metadata: true
});
udpPort.open();


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
    var inputName = 'nanoPAD2:nanoPAD2 nanoPAD2 _ CTRL 20:0'
    var inputs = easymidi.getInputs();
    if (inputs.includes(inputName)) 
    {
        input = new easymidi.Input(inputName);
        console.log(" OK")
        
        
        console.log('will send OSC to Player ',playerAddr, playerPort)

        input.on('noteon', function (msg) {
            console.log(msg['note'], notes[msg['note']])
            sendPad(notes[msg['note']])
        });

    }
    else setTimeout(openMidi, 2000)
}

var notes = []
for (var k=0; k<127; k++) notes[k] = [0,0]
for (var k=37; k<127; k+=2) notes[k] = [Math.floor( (k-37)/16 )+1, Math.ceil((k-37)/2)%8+1 ]
for (var k=36; k<127; k+=2) notes[k] = [Math.floor( (k-36)/16 )+1, Math.ceil((k-36)/2)%8+9 ]

console.log('.:: PAD-osc ::.\n')
process.stdout.write(`Looking for nanoPAD2... `)
openMidi()