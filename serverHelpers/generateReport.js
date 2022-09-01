const { jsPDF } = require("jspdf");

function generateReport(
    posts, 
    reviews, 
    name, 
    prisonNumber, 
    curriculumCompleted, 
    softskillsCompleted, 
    postsTotal, 
    reviewsTotal) {
    posts = sortPosts(posts.rows)
    reviews = sortPosts(reviews.rows)
    let dateStarted = posts[0].date
    let doc = new jsPDF('a4');
    doc.setFontSize(30);
    doc.text(10, 20, `${name}'s general info: \r\n`);
    doc.setFontSize(10);
    doc.text(10, 40, `name: ${name}\nprison number: ${prisonNumber}`);
    doc.text(10, 60, `Started Code4000 course on ${dateStarted}\r\n
                    ${curriculumCompleted} of curriculum completed\r\n
                    ${softskillsCompleted} of soft skilles developed\r\n
                    ${postsTotal} posts in total\r\n
                    ${reviewsTotal} reviews reviewed by instructors\r\n`);
    doc.addPage('a4', 'p');
    doc.setFontSize(30);
    doc.text(10, 20, `${name}'s reflections: `);
    doc.setFontSize(10);
    
   let postsArray = [];
    for (let i = 0; i < posts.length; i++) {
        postsArray.push(' ')
        postsArray.push(`Date: ${posts[i].date}`)
        postsArray.push(' ')
        postsArray.push(`text: `)
        let postsLines = doc.splitTextToSize(posts[i].text, 150)
        for (let n = 0; n < postsLines.length; n++ ) {
            postsArray.push(postsLines[n])
        }
       postsArray.push(' ')
        postsArray.push(`commented by instructor: `)
        let commentLines = doc.splitTextToSize(posts[i].comment, 150)
        for (let n = 0; n < commentLines.length; n++ ) {
            postsArray.push(commentLines[n])
        }
        postsArray.push(' ')
        postsArray.push('-'.repeat(140))
    }
    let y = 20;
    let pageHeight = doc.internal.pageSize.height;
    for ( let i = 0; i<postsArray.length; i++) {
        y += 5;
        if (y >= pageHeight - 20) {
            doc.addPage('a4', 'p')
            y = 20;
        }
        doc.text(10, y, postsArray[i])
    } 
    doc.addPage('a4', 'p')
    doc.setFontSize(30);
    doc.text(10, 20, `${name}'s project reviews: `);
    doc.setFontSize(10);
    let reviewsArray = [];
    for (let i = 0; i < reviews.length; i++) {
        reviewsArray.push(' ')
        reviewsArray.push(`Date: ${reviews[i].date}`)
        reviewsArray.push(' ')
        reviewsArray.push(`Project title: `)
        reviewsArray.push(reviews[i].title)
        reviewsArray.push(' ')
        let reviewsLines = doc.splitTextToSize(reviews[i].review, 150)
        for (let n = 0; n < reviewsLines.length; n++ ) {
            reviewsArray.push(reviewsLines[n])
        }
        reviewsArray.push(' ')
        reviewsArray.push('-'.repeat(140))
    }
    let yy = 20;
    
    for ( let i = 0; i<reviewsArray.length; i++) {
        yy += 5;
        if (yy >= pageHeight - 20) {
            doc.addPage('a4', 'p')
            yy = 20;
        }
        doc.text(10, yy, reviewsArray[i])
    } 
        
    doc.save(`${name + '-' + prisonNumber}.pdf`);
}

function sortPosts(...posts) {
    return posts[0].sort(function(a, b) {
        return a.id - b.id
    })
}

module.exports = {generateReport}