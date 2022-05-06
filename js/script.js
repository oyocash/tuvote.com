const dataFuniikaUrl = "https://data.funiika.com"

const hashesURL = dataFuniikaUrl + "/hashes"
const evalsURL = dataFuniikaUrl + "/evals"
const evalsCountURL = dataFuniikaUrl + "/evalsCount"
const linksURL = dataFuniikaUrl + "/links"
const sendTxURL = dataFuniikaUrl + "/pushTx"

let userData = {}

// nav
function toogleMenu() {
    const navButton = document.getElementById("menu-button")
    const navMenu = document.getElementById("menu");
    navMenu.classList.toggle('hidden');
}

// loader
async function fetchHtmlAsText(url) {
    return await (await fetch(url)).text();
}
async function loadHeader() {
    const contentDiv = document.getElementById("header");
    if (contentDiv !== null) {
      contentDiv.innerHTML = await fetchHtmlAsText("/includes/header.html");
    }
}
async function loadHeaderNotLogged() {
    const contentDiv = document.getElementById("headerNotLogged");
    if (contentDiv !== null) {
      contentDiv.innerHTML = await fetchHtmlAsText("/includes/headerNotLogged.html");
    }
}
async function loadFooter() {
    const contentDiv = document.getElementById("footer");
    if (contentDiv !== null) {
      contentDiv.innerHTML = await fetchHtmlAsText("/includes/footer.html");
    }
}
// END loader

// login
function getUserData() {
  let address = localStorage.getItem("user.address")
  let pk = localStorage.getItem("user.pk")
  let postOnchain = localStorage.getItem("user.postOnchain")
  if (pk) {
    const privKey = new bsvjs.PrivKey().fromString(pk)
    const keyPair = new bsvjs.KeyPair().fromPrivKey(privKey);
    userData = {address: address, pk: pk, keyPair: keyPair, postOnchain: postOnchain}
  }
}

function loginUP (username, password) {
  let hashedUsername, hashedPassword 
  if (username && password) {
    hash(username).then((hex) => {
      hashedUsername = hex
      return hash(password)
    }).then((hex) => {
      hashedPassword = hex
      return hash(hashedUsername + hashedPassword)
    }).then((hex) => {
      const privKey = new bsvjs.PrivKey().fromHex("80" + hex)
      const keyPair = new bsvjs.KeyPair().fromPrivKey(privKey);
      const pubKey = keyPair.pubKey;
      const address = new bsvjs.Address().fromPubKey(pubKey)
      localStorage.setItem('user.address', address.toString())
      localStorage.setItem('user.pk', privKey.toWif().toString())
      userData = {address: address.toString(), pk: privKey.toWif().toString(), keyPair: keyPair}
    })
  }
}

function loginPK (pk) {
  let privKey
  if (/^#[0-9A-F]{32}$/i.test(pk)) {
    privKey = new bsvjs.PrivKey().fromHex("80" + pk)
  } else {
    privKey = new bsvjs.PrivKey().fromString(pk)
  }
  const keyPair = new bsvjs.KeyPair().fromPrivKey(privKey);
  const pubKey = keyPair.pubKey;
  const address = new bsvjs.Address().fromPubKey(pubKey)
  localStorage.setItem('user.address', address.toString())
  localStorage.setItem('user.pk', privKey.toWif().toString())
  userData = {address: address.toString(), pk: privKey.toWif().toString(), keyPair: keyPair}
}

function logout() {
  userData = {}
  localStorage.removeItem('user.address')
  localStorage.removeItem('user.pk')
  location.href = './index.html';
}
// END login

// retrieve data
function getPolls(hashes) {
  return new Promise(function(resolve, reject) {
    fetch(hashesURL, {
      method: 'post',
      body: JSON.stringify( {hashes: hashes} )  
    })
    .then(response => {
       if (!response.ok) {
           throw new Error("HTTP error " + response.status);
       }
       return response.json();
    })
    .then(json => {
      let selectedRecords = []
      for (let i = json.length - 1; i >= 0; i--) {
        let record = json[i]
        let str = new Option(record.string).innerHTML
        str = str.replace(/(?:\r\n|\r|\n)/g, '<br>');

        let selectedRecord = {
          address: record.address,
          hash: record.hash,
          record: str,
          date: new Date(record.timestamp)
        };
        selectedRecords.unshift(selectedRecord)
      }
      resolve(selectedRecords)
    })
    .catch(function () { 
    })
  })
}

async function getAnswersHashes(hash, address) {
  return new Promise(function(resolve, reject) {
    var params = {}
    params.addresses = [address]
    params.directions = [hash]
    params.relations = ["answer"]

    fetch(linksURL, {
      method: 'post',
      body: JSON.stringify( params )  
    })
    .then(response => {
       if (!response.ok) {
           throw new Error("HTTP error " + response.status);
       }
       return response.json();
    })
    .then(json => {
      let answersHashes = []
      for (let i = json.length - 1; i >= 0; i--) {
        answersHashes.unshift(json[i].point)
      }
      resolve(answersHashes)
    })
  });
}

async function getAnswerCount(hash, answer) {
  return new Promise(function(resolve, reject) {
    var params = {}
    params.hashes = [hash]
    params.values = [answer]

    fetch(evalsCountURL, {
      method: 'post',
      body: JSON.stringify( params )  
    })
    .then(response => {
       if (!response.ok) {
           throw new Error("HTTP error " + response.status);
       }
       return response.json();
    })
    .then(json => {
      resolve(json)
    })
  });
}

async function getPollEvals(hash, answers, addresses = null) {
  return new Promise(function(resolve, reject) {
    var params = {}
    params.hashes = [hash]
    params.values = answers
    if (addresses !== null && json !== "[]" && json.length !== 0) {
      params.addresses = addresses
    }

    fetch(evalsURL, {
      method: 'post',
      body: JSON.stringify( params )  
    })
    .then(response => {
       if (!response.ok) {
           throw new Error("HTTP error " + response.status);
       }
       return response.json();
    })
    .then(json => {
      if (json === null || json === "[]" || json.length === 0)
      {
        resolve(null)
        return
      }
      resolve(json)
    })
  })
}

async function getUserAnswer(hash, address, answers) {
  return new Promise(function(resolve, reject) {
    var params = {}
    params.hashes = [hash]
    params.addresses = [address]
    params.values = answers
    params.limit = 1

    fetch(evalsURL, {
      method: 'post',
      body: JSON.stringify( params )  
    })
    .then(response => {
       if (!response.ok) {
           throw new Error("HTTP error " + response.status);
       }
       return response.json();
    })
    .then(json => {
      if (json === null || json === "[]" || json.length === 0)
      {
        resolve(null)
        return
      }
      resolve(json[0].value)
    })
  })
}

async function getAnswers(hash, address) {
  return new Promise(function(resolve, reject) {
    getAnswersHashes(hash, address).then(r => {
      let answersHashes = r
      if (answersHashes.length === 0)
        return

      let searchQuery = {}
      searchQuery.hashes = answersHashes

      fetch(hashesURL, {
        method: 'post',
        body: JSON.stringify( searchQuery )  
      })
      .then(response => {
        if (!response.ok) {
          throw new Error("HTTP error " + response.status);
        }
        return response.json();
      })
      .then(json => {
        resolve(json)
      })
      .catch(function () {
      })

    })
    .catch(function () {
    })
  })
}

async function getAllAnswers(address) {
  return new Promise(function(resolve, reject) {
    let searchQuery = {}
    searchQuery.addresses = [address]
    searchQuery.relations = ["answer"]

    fetch(linksURL, {
      method: 'post',
      body: JSON.stringify( searchQuery )  
    })
    .then(response => {
      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }
      return response.json();
    })
    .then(json => {
      resolve(json)
    })
    .catch(function () {
    })
  })
}
// end retrieve data

// tx send
function checkHash(hash) {
  return new Promise(function(resolve, reject) {
    fetch(hashesURL, {
      method: 'post',
      body: JSON.stringify( {hashes: [hash]} )  
    })
    .then(response => {
      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }
      return response.json();
    })
    .then(json => {
      resolve(json)
    })
    .catch(function () {
    })
  });
}

async function saveEval(hex, value) {
  return new Promise(function(resolve, reject) {
    let dataToPush = ["eval", "0x" + hex, value]
    requestUTXO().then ((data) => {
      buildForge(data, dataToPush, null, null, "Evaluated successfully")
      resolve(0)
    })
  })
}

async function saveHash(hex, string) {
  return new Promise(function(resolve, reject) {
    let dataToPush = ["hash", "0x" + hex, string]
    requestUTXO().then ((data) => {
      buildForge(data, dataToPush, null, null, "Record added")
      resolve(0)
    })
  })
}

async function saveLink(point, direction, relation) {
  return new Promise(function(resolve, reject) {
    let dataToPush = ["link", "0x" + point, "0x" + direction, relation]
    requestUTXO().then ((data) => {
      buildForge(data, dataToPush, null, null, "Comment added")
      resolve(0)
    })
  })
}

async function requestUTXO() {
  // mattercloud.net utxo  (not working)
  // let utxoUrl = 'https://api.mattercloud.net/api/v3/main/address/' + address.toString() + '/utxo';
  // let response = await fetch(utxoUrl)
  // return await response.json()
  let utxoUrl = 'https://api.whatsonchain.com/v1/bsv/main/address/' + userData.address + '/unspent';
  let response = await fetch(utxoUrl)
  let data = await response.json()

  // wallet is empty
  if (data === undefined || data.length == 0) {
    return {}
  }

  let unspentTX = data[0]
  let txUrl = `https://api.whatsonchain.com/v1/bsv/main/tx/hash/${unspentTX.tx_hash}`;
  let response2 = await fetch(txUrl)
  let data2 = await response2.json()
  const utxo = {
    txid: unspentTX.tx_hash,
    vout: unspentTX.tx_pos,
    satoshis: unspentTX.value,
    script: data2.vout[unspentTX.tx_pos].scriptPubKey.hex,
    address: userData.address
  }
  return utxo
}

async function buildForge(utxo, txdata = null, address = null, amount = null, message) {
  var outputs = []

  if (txdata) {
    outputs.push({data: txdata})
  }
  if (address && amount) {
    outputs.push({to: address, satoshis: amount})
  }

  var forgeObj = {
    outputs: outputs,
    changeTo: utxo.address
  }
  if (userData['postOnchain']) {
    forgeObj['inputs'] = [utxo]
  }

  const forge = new TxForge.Forge(forgeObj)

  forge.build();

  let bsvTx = new bsvjs.Tx().fromObject(forge.tx);
  var keyPair = userData['keyPair']
  forge.sign({keyPair});
  let rawTx = forge.tx.toHex()

  if (!userData['postOnchain']) {
    const univrseKey = Univrse.util.fromBsvPrivKey(keyPair.privKey)
    const univrsePub = Univrse.util.fromBsvPubKey(keyPair.pubKey)

    // Sign using a single key
    const envelope = Univrse.Envelope.wrap(rawTx)
    await envelope.sign(univrseKey, { alg: 'ES256K-BSM', kid: keyPair.pubKey.toString() })
    var envString = envelope.toString()

    sendTxOffchainFetch(envString, message)
  } else {
    sendTxOnchainFetch(rawTx, message)
  }
}

const sendTxOffchainFetch = (envelope, successMessage) => {
  var params = {}
  params = {
    envelope: envelope
  }

  fetch(sendTxURL, {
    method: 'post',
    body: JSON.stringify( params )
  }).then(response => { 
    if (response.status === 200) {
      console.log(successMessage)
    } else {
      console.log("An error occurred. Please try again")
      console.log(JSON.stringify(response))
    }
  })
  .catch(function () {
     this.dataError = true;
  })
}

const sendTxOnchainFetch = (rawTx, successMessage) => {
  fetch('https://merchantapi.taal.com/mapi/tx', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({"rawtx": rawTx, "callBackUrl": "https://funiika.com/"})
  }).then(response => { 
    if (response.status === 200) {
      document.querySelector('[x-data]').__x.$data.message = successMessage
    } else {
      document.querySelector('[x-data]').__x.$data.message = "An error occurred. Please try again"
    }
  });
}

function hash(string) {
  const utf8 = new TextEncoder().encode(string);
  return crypto.subtle.digest('SHA-256', utf8).then((hashBuffer) => {
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((bytes) => bytes.toString(16).padStart(2, '0'))
      .join('');
    return hashHex;
  });
}
// END tx send

