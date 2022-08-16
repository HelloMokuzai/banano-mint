//original: jetstream0/prussia's banano nft client

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

window.bananocoinBananojs.setBananodeApiUrl(
  "https://kaliumapi.appditto.com/api"
);

function mint_fail(reason) {
  document.querySelector(".fail.msg-container").style.display = "block";
  document.getElementById("fail-msg").innerText = reason;
}

function mint_succeed(rep) {
  document.querySelector(".success.msg-container").style.display = "block";
  document.getElementById("nft-rep").innerText = rep;
}

async function pin_json(json_data) {
  let api_key = document.getElementById("key").value;
  let api_secret = document.getElementById("secret").value;
  let json_resp = await fetch(
    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    {
      method: "POST",
      body: JSON.stringify(json_data),
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        pinata_api_key: api_key,
        pinata_secret_api_key: api_secret,
      },
    }
  );
  json_resp = await json_resp.json();
  console.log(json_resp);
  if (json_resp.IpfsHash) {
    return json_resp.IpfsHash;
  } else {
    return false;
  }
}

async function pin_images() {
  //get image
  let file_input = document.getElementById("file");
  let file = file_input.files[0];
  let data = new FormData();
  //get api key and api secret
  let api_key = document.getElementById("key").value;
  let api_secret = document.getElementById("secret").value;
  //pin to ipfs using pinata api
  //stream()
  data.append("file", file, "ban_nft.png");
  data.append("pinataOptions", JSON.stringify({ cidVersion: 0 }));
  let img_resp = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    body: data,
    headers: {
      //'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
      pinata_api_key: api_key,
      pinata_secret_api_key: api_secret,
    },
  });
  img_resp = await img_resp.json();
  console.log(img_resp);
  if (img_resp.IpfsHash) {
    return img_resp.IpfsHash;
  } else {
    return false;
  }
}

async function mint() {
  //reset fail messages
  document.querySelector(".fail.msg-container").style.display = "none";
  document.querySelector(".success.msg-container").style.display = "none";
  //get data
  let supply = Number(document.getElementById("supply").value);
  let seed = document.getElementById("seed").value.trim();
  let ban_address;
  try {
    ban_address = await window.bananocoinBananojs.getBananoAccountFromSeed(
      seed,
      0
    );
  } catch (e) {
    mint_fail("Error: Invalid Banano Address");
    return;
  }
  console.log(ban_address)
  if (!ban_address) {
    mint_fail("Error: Invalid Banano Address");
    return;
  }
  //create supply block by creating public key
  //get versions
  let major_version = 1;
  let mv_pub = major_version.toString(16);
  mv_pub = "0".repeat(10 - mv_pub.length) + mv_pub;
  let minor_version = 0;
  let mn_pub = minor_version.toString(16);
  mn_pub = "0".repeat(10 - mn_pub.length) + mn_pub;
  let patch_version = 0;
  let pt_pub = patch_version.toString(16);
  pt_pub = "0".repeat(10 - pt_pub.length) + pt_pub;
  //get supply
  if (Number(supply) === NaN) {
    mint_fail("Error: Supply not a number");
    return;
  }
  let supply_pub = supply.toString(16);
  supply_pub = "0".repeat(16 - supply_pub.length) + supply_pub;
  let s_pub_key = "51BACEED6078000000" + mv_pub + mn_pub + pt_pub + supply_pub;
  let supply_rep = window.bananocoinBananojs.getBananoAccount(s_pub_key);
  //SET REP, which creates the supply block
  await sleep(500);
  let supply_block_hash;
  try {
    supply_block_hash = await window.bananocoinBananojs.changeBananoRepresentativeForSeed(
      seed,
      0,
      supply_rep
    );
  } catch (e) {
    mint_fail("Error: Failed to change Rep. Address unopened?");
    return;
  }
  //upload images
  let img_hash;
  try {
    img_hash = await pin_images();
  } catch (e) {
    console.log(e)
    mint_fail("Error: Failed to pin images to IPFS");
    return;
  }
  if (!img_hash) {
    mint_fail("Error: Failed to pin images to IPFS");
    return;
  }
  await sleep(500);
  //create json text
  let json_info = {};
  json_info.name = document.getElementById("name").value;
  json_info.image = img_hash;
  json_info.description = document.getElementById("description").value;
  json_info.properties = {
    issuer: ban_address,
    supply_block_hash: supply_block_hash,
  };
  console.log(json_info);
  let json_hash;
  try {
    json_hash = await pin_json(json_info);
  } catch (e) {
    console.log(e)
    mint_fail("Error: Failed to pin metadata to IPFS");
    return;
  }
  if (!json_hash) {
    mint_fail("Error: Failed to pin metadata to IPFS");
    return;
  }
  //cid to account
  let MAP = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let decoded = toHexString(from_b58(json_hash, MAP)).toUpperCase();
  //remove 1220
  let nft_rep_pub = decoded.slice(4);
  let nft_rep_addr = window.bananocoinBananojs.getAccount(nft_rep_pub, "ban_");
  mint_succeed(nft_rep_addr);
}
