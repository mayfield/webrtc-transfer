
export async function initiate() {
    const pc = new RTCPeerConnection(null);
    const dataChannel = pc.createDataChannel('send');
    self.dc = dataChannel;
    dataChannel.addEventListener('open', ev => { console.warn(ev); });
    dataChannel.addEventListener('close', ev => { console.warn(ev); });
    // We don't actually exchange ice dynamically; wait for all the local candidates then
    // we'll send the offer with our complete list.  "One is all you need!"
    const iceNegotiation = new Promise(resolve =>
        pc.addEventListener('icecandidate', ev => !ev.candidate && resolve()));
    await pc.setLocalDescription(await pc.createOffer());
    await iceNegotiation;
    const offer = pc.localDescription;
    console.info("Copy the following offer into the recv client...");
    console.info(offer.sdp);
    console.info(btoa(offer.sdp));
    return pc;
}

export async function answer(pc, sdp) {
    await pc.setRemoteDescription(new RTCSessionDescription({type: 'answer', sdp}));
}

export async function accept(sdp) {
    const pc = new RTCPeerConnection(null);
    pc.addEventListener('datachannel', ev => {
        self.dc = ev.channel;
    });
    const iceNegotiation = new Promise(resolve =>
        pc.addEventListener('icecandidate', ev => !ev.candidate && resolve()));
    await pc.setRemoteDescription(new RTCSessionDescription({type: 'offer', sdp}));
    await pc.setLocalDescription(await pc.createAnswer());
    await iceNegotiation;
    const answer = pc.localDescription;
    console.info("Copy the following offer into the send client...");
    console.info(btoa(answer.sdp));
    return pc;
}


document.addEventListener('DOMContentLoaded', async ev => {
    if (location.search.match(/recv/)) {
        document.querySelector('#peeroffer').style.display = 'initial';
        const sdp = document.querySelector('#peeroffer textarea');
        const submit = document.querySelector('#peeroffer input[type="submit"]');
        submit.addEventListener('click', ev => accept(atob(sdp.value)));
    } else {
        const pc = await initiate();
        document.querySelector('#peeranswer').style.display = 'initial';
        const sdp = document.querySelector('#peeranswer textarea');
        const submit = document.querySelector('#peeranswer input[type="submit"]');
        submit.addEventListener('click', ev => answer(pc, atob(sdp.value)));
    }
});

