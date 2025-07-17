function solution(str){
    let g = [];
    let f = "";
    for (let i = 0; i < str.length - 1; i + 2) {
        g.push(str[i - 2] + str[i - 1]);
    }
    console.log(g)
}
solution("geekko bay");