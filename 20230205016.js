// 20230205016 Batuhan İŞLEN
// 20230205022 Utku Kıvanç BOY
// 20230205001 Abidat Arda AKSU


const fs = require('fs');
const { exit } = require('process');
const readline = require('readline');
const tumMaclar = fs.readFileSync('./maclar.txt', 'utf-8');
const ayrikMaclar = tumMaclar.split('\n');


function sonuclar(){  // maclar.txt okunup bosluklara gore split edildiken sonra maclardaki takimlar ve skorlar tek tek alinir, gerekli arraylere konulur
    const teams = [];
    const scores = [];
    for  (let i = 0; i < ayrikMaclar.length; i ++){
        let temp = ayrikMaclar[i].split(' ')
        
        for (let x = 0; x < 4; x++){
            let temp2 = temp[x];
            if (!isNaN(Number(temp2))) scores.push(temp2);
            else teams.push(temp2);
        }
    }
    return {teams,scores};
}

function oynamaChecker(a){ // ayni macin daha once oynanyip oynanmadigini kontrol eder
    const data = fs.readFileSync('./evsahibi.json', 'utf-8');
    const oynananlar = JSON.parse(data);
    
    let temp = a;
    let matchFound = false;
    
    oynananlar.forEach(match => {
        if (match.mac == temp) {
            matchFound = true;
            console.log(`${temp} eslesti, mac atlandi`);
            return false;
        }
    });
        if (!matchFound) {
            oynananlar.push({"mac": `${temp}`});
            fs.writeFileSync('./evsahibi.json', JSON.stringify(oynananlar, null, 2), 'utf-8');
            return true;
        }
    
}

function checker(a){ // mac daha once oynanmamissa kazanan,kaybeden,beraberlik ve atilan golleri return eder
    //const [team1, team2] = [sonuclar().teams[2*(a-1)], sonuclar().teams[1+2*(a-1)]];
    //const [score1, score2] = [sonuclar().scores[2*(a-1)], sonuclar().scores[1+2*(a-1)]];
    
    const [team1, team2] = [sonuclar().teams[2*a], sonuclar().teams[1+2*a]];
    const [score1, score2] = [sonuclar().scores[2*a], sonuclar().scores[1+2*a]];
    let winner,loser;
    let temp = score1-score2;
    
    
    if (oynamaChecker(`${team1}${team2}`)){
        if (temp> 0 ){
            winner = team1;
            loser = team2;
            return [winner,loser,[score1,score2],'w'];
        }else if(temp<0){
            winner = team2;
            loser = team1;
            return[winner,loser,[score2,score1],'w'];
        }else{
            return [team1, team2,[score1,score2],'d'];
        }
    }

}

function verileriGuncelle(callback){ //checker fonksiyonu kullanarak takimlarin durumlarini gunceller, yenitakimlar.json dosyasina yazdirir
    const data = fs.readFileSync('takimlar.json', 'utf8');
    const puanlar = fs.readFileSync('ayarlar.json', 'utf8');
    let [teams,puan] = [JSON.parse(data), JSON.parse(puanlar)];
    let [win,lose,beraber] = [puan.galibiyetPuan, puan.maglubiyetPuan, puan.beraberlikPuan];
    
    for(let i =0; i< ayrikMaclar.length; i++){
        let matchResult = checker(i); 
        
        if (!matchResult) continue;

        let gol = Number(matchResult[2][0]);
        if (matchResult[3] == 'd') {
            let [draw1, draw2] = [matchResult[0], matchResult[1]];
            teams.forEach(team => {
                if (team.takimKisaAdi == draw1 || team.takimKisaAdi == draw2) {
                    team.oynanan += 1;
                    team.beraberlik += 1;
                    team.atilan += gol;
                    team.yenilen += gol;
                    team.puan += beraber;
                }
            });
        }
        if (matchResult[3] == 'w') {
            let [winner, loser, gol1, gol2, average] = [matchResult[0], matchResult[1], Number(matchResult[2][0]), Number(matchResult[2][1]), Number(matchResult[2][0]-matchResult[2][1])];
            teams.forEach(team => {
                if (team.takimKisaAdi == winner) {
                    team.oynanan += 1;
                    team.galibiyet += 1;
                    team.atilan += gol1;
                    team.yenilen += gol2;
                    team.averaj += average;
                    team.puan += win;
                }
                if (team.takimKisaAdi == loser) {
                    team.oynanan += 1;
                    team.maglubiyet += 1;
                    team.atilan += gol2;
                    team.yenilen += gol1;
                    team.averaj += -1 * average;
                    team.puan += lose;
                }
            });
        }
        callback();
    }


    fs.writeFileSync('./evsahibi.json', '[]', 'utf-8'); // evsahibi dosyasini sifirliyoruz ki sonraki calistirmalarda hesap duzgun olsun.
    fs.writeFileSync('./yeniTakimlar.json', JSON.stringify(teams,null,2))  // en son guncel puan ve maclar yazimi

}
    
function macGirisi(callback){ //klavyeden mac girisi
    const rl = readline.createInterface({input: process.stdin, output: process.stdout});
    
    rl.question('\nMac giriniz : ', (input) =>{
        input = input.trim().toUpperCase();
        let temp = input.split(' ');
        let takimlar = [temp[0], temp[2]];
        if (temp.length != 4) console.log('\ngecersiz bir mac girdiniz\n');
        else {
            if (!isNaN(Number(temp[1])+Number(temp[3])) && isNaN(Number(temp[0])) && isNaN(Number(temp[2]))) {
                let temp = true;
                for(const takim of takimlar ){
                    if(!takimCheck(takim)){
                        console.log(`\n${takim} takimi ekli degildir, lutfen ekleyiniz\n`);
                        temp = false;
                        rl.close();
                    }
                }
                if (temp){
                    fs.appendFileSync('./maclar.txt', `\n${input}`, 'utf-8');
                    console.log('\nMAC EKLENDI\n');
                }
            }
            else console.log("\ngirdiginiz mac yanlis formatta\n");
        }
        rl.close();
        callback();
    }) 
}

function takimCheck(input){ // mac girisi fonksiyonunda girilen takimin ekli olup olmadigini kontrol eder
    const data = fs.readFileSync('takimlar.json', 'utf8');
    let teams = JSON.parse(data)
    let exists= false;
    teams.forEach(takimlar =>{
        if(takimlar.takimKisaAdi == input) exists = true;
    })
    return exists;
}

function takimEkle(callback){ // klavyeden takim girisi
    const data = fs.readFileSync('takimlar.json', 'utf8');
    let teams = JSON.parse(data)

    const rl = readline.createInterface({input: process.stdin, output: process.stdout});
    rl.question('\nArada bosluk birakarak takimAdi ve kisaAd giriniz ornegin --> "besiktas b" : ', (input) =>{
        input = input.trim().split(' ');
        let [uzun,kisa] = [input[0], input[1].toLocaleUpperCase()];
        
        if (kisa.length == 1 && uzun.length < 13){
            let yeniTakim = { "takimKisaAdi": `${kisa}`, "takimAdi": `${uzun}`, "oynanan": 0, "galibiyet" : 0, "beraberlik" : 0, "maglubiyet" : 0, "atilan" : 0, "yenilen" : 0, "averaj" : 0 , "puan" : 0};
            teams.push(yeniTakim);
            fs.writeFileSync('./takimlar.json', JSON.stringify(teams,null,2))  // en son guncel puan ve maclar yazimi
            console.log("\nTakim eklendi.\n")
        }else console.log("\nTakma isim 1 karakterden, uzun isim en fazla 12 karakterden olusabilir\n");
        
        rl.close();
        callback();
    })
    
    fs.writeFileSync('./yeniTakimlar.json', JSON.stringify(teams,null,2))  // en son guncel puan ve maclar yazimi

}

function fikstur(buyuk, input){    // puan, alfabetik uzun takim adi ve alfabetik kisa takim adi olacak sekilde fikstur siralama 
    const data = fs.readFileSync('yeniTakimlar.json', 'utf8');
    let fikstur = JSON.parse(data);
    
    
    
    if(input == 'p'){
        fikstur.sort((a,b) =>{
            if (a.puan != b.puan) return b.puan-a.puan;
            if (a.averaj != b.averaj) return b.averaj-a.averaj;
            return b.atilan-a.atilan;
        });
    }else if (input == 't')  fikstur.sort((a, b) => a.takimKisaAdi.localeCompare(b.takimKisaAdi));
    else if (input == 'a') fikstur.sort((a, b) => a.takimAdi.localeCompare(b.takimAdi));     
    
    if (buyuk) fikstur.forEach((data) => data.takimAdi = data.takimAdi.toUpperCase());
    fs.writeFileSync('./fikstur.json', JSON.stringify(fikstur,null,2));

}

function main(){
    console.log('----------- LIG FIKSTURU ---------');
    console.log('1. Manuel mac ekle');
    console.log('2. Manuel takim ekle');
    console.log('--- TAKIM ISMI BUYUK OLMASI ICIN YANINA B KOY --- (3b,4b,5b)');
    console.log('3. Fikstur siralama PUAN ');
    console.log('4. Fikstur siralama ALFABETIK');
    console.log('5. Fikstur siralama ALFABETIK TAKMA AD');
    console.log('6. Exit\n------------------------------------');
    
    const rl = readline.createInterface({input: process.stdin, output: process.stdout});
    rl.question('islem giriniz : ', (input) =>{
        if (input.length == 2 && input[input.length-1].toLowerCase() == 'b' ){ //buyuk takim ismi fikstur
            if(input[0]=='3'){
                verileriGuncelle(() =>{fikstur(true,'p');}); 
                console.log('\nFikstur guncellendi\n');
            }else if(input[0]=='4'){
                verileriGuncelle(() =>{fikstur(true,'a');}); 
                console.log('\nFikstur guncellendi\n');
            }else if(input[0]=='5'){
                verileriGuncelle(() =>{fikstur(true,'t');});
                console.log('\nFikstur guncellendi\n');
            }else console.log('\nGecersiz input\n');
            rl.close();
            main();
            return;
        }

        
        if (input == '1'){
            rl.close();
            macGirisi(()=>{main();});
            main();
        }else if(input == '2'){
            rl.close();
            takimEkle(()=>{main();});
            main();
        }else if(input =='3'){
            rl.close();
            verileriGuncelle(() =>{fikstur(false,'p');});
            console.log('\nFikstur guncellendi\n')
            main();
        }else if(input =='4'){
            rl.close();
            verileriGuncelle(() =>{fikstur(false,'a');});
            console.log('\nFikstur guncellendi\n')
            main();
        }else if(input =='5'){
            rl.close();
            verileriGuncelle(() =>{fikstur(false,'t');});
            console.log('\nFikstur guncellendi\n')
            main();
        }else if(input == '6') process.exit();
        else{
            console.log('\nGecersiz input girdiniz\n');
            rl.close();
            main();
        }
    });
}




main();
