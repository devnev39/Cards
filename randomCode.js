function generateRandom(length){
    let num = "";
    Array.from(Array(length).keys()).forEach(key => {
        let rand = Math.round(Math.random()*9)
        while(key == 0 && rand == 0) rand = Math.round(Math.random()*9);
        num += rand;
    })
    return +num;
}

async function generateRandomUser(){
    const result = await (await fetch("https://randomuser.me/api/")).json();
    return result.results[0].name.first;
}

async function generateUser(length){
    const u = await generateRandomUser();
    return {
        playerID : generateRandom(length),
        name : u
    }
}

export const getUser = generateUser;
export const getRandom = generateRandom;
export const getRandomName = generateRandomUser;