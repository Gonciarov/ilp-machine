document.addEventListener('scroll', function(e) {
    console.log(window.scrollX)
       if (window.scrollX > 20) {
           
           document.getElementsByClassName("sidebar")[0].style = "width: 200px; padding: 0px;"
           document.getElementsByClassName("fixed-part")[0].style = "display: none;";
           document.getElementsByClassName("dashboard-column-1")[0].style = "margin-left: -80px;";
           document.getElementsByClassName("dashboard-column-2")[0].style = "margin-left: -70px;";
           document.getElementsByClassName("posts-header")[0].style = "margin-left: -80px;";
       } 
       else {
            document.getElementsByClassName("sidebar")[0].style = "width: 300px; padding: 10px;"
           document.getElementsByClassName("fixed-part")[0].style = "display: block";
           document.getElementsByClassName("dashboard-column-1")[0].style = "margin-left: 0px";
           document.getElementsByClassName("dashboard-column-2")[0].style = "margin-left: 0px;";
           document.getElementsByClassName("posts-header")[0].style = "margin-left: 0px;";
       } 
   })