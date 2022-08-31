async function get_nfts_for_account() {
  let account = document.getElementById("address").value;
  let resp;
  try {
    //WILL TAKE A WHILE PROBABLY. Maybe a loading animation?
    resp = await fetch("https://bannfts.prussiafan.club/api/v1/account/"+account);
  } catch (e) {
    console.log(e);
    return;
  }
  resp = await resp.json();
  if (!resp) {
    return;
  }
  if (resp.length === 0) {
    //no nfts
  } else {
    console.log(resp)
    if (resp.length > 6) {
      for (let i=0; i < resp.length-6; i++) {
        let nft_div = document.getElementById("nft-6").cloneNode(true);
        nft_div.id = "nft-"+String(7+i);
        document.getElementById("nft-list").appendChild(nft_div);
      }
    }
    for (let nft_num=0; nft_num < resp.length; nft_num++) {
      let nft_info = resp[nft_num];
      //set image source
      document.getElementById("nft-"+String(nft_num+1)).children[0].children[0].src = "https://ipfs.io/ipfs/"+nft_info.image;
    }
  }
}
