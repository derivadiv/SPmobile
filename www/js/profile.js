/**
 Less than 0 means a comes before b. Want most recent ("biggest") first. 
 if end not present, we assume it's still going, and that should be favored to go first
 if start not present when end was also not present, we can only compare if start dates are there, no idea if not present
*/
function cmpenc(a1,b1) {
  var a = a1.resource;
  var b = b1.resource;
  if (a.period && b.period){
    if (a.period.end){
      if (b.period.end){
        if (a.period.end > b.period.end){
          return -1;
        }
        if (a.period.end < b.period.end){
          return 1;
        }
        return 0;
      }
      return 1;
    }
    if (b.period.end){
      return 1;
    }
    if (a.period.start){
      if (b.period.start){
        if (a.period.start > b.period.start){
          return -1;
        }
        if (a.period.start < b.period.start){
          return 1;
        }
        return 0;
      }
    }
  }
  return 0;
}

function docfilter(x, i, arr){ 
  if (x.reference && x.reference.split("/")[0]=="Practitioner"){
    return true;
  }  
  return false;
}

function getdocname(doc){
  if (doc.display){
    return doc.display;
  }
  else {
    smart.patient.api.search({type: "Practitioner", query: {identifier: doc.reference.split("/")[1]}
    }).then(function(r){
      if (r.data.total > 0){
        doc = r.data.entry[0];
        return doc.name.family.join(" ");
      }
    });
  }
}

function profile(smart, langdict){
  var pq = smart.patient.read();

  var outvars = {};

  pq.then(function(p) {
    /* Patient bio */
    var pid = p.id;
    var name = p.name[0];
    outvars["first"] = name.given.join(" ");
    outvars["last"] = name.family.join(" ");
    $("#patient_name").append(outvars["first"] + " " + outvars["last"]);
    
    smart.patient.api.search({type: "Encounter", query: {patient: pid}
    }).then(function(r){
      if (r.data.total > 0){
        /* Want most recent visit: get its date */
        console.log(r.data.entry);  
        re = r.data.entry.sort(cmpenc)[0];
        var rx = re.resource;
        console.log(rx);
        var date = [];
        if (rx.period){
          if (rx.period.start){
            date.push(rx.period.start);
          }
          if (rx.period.end){
            if (date.length==0 || date[0]!== rx.period.end){
              date.push(rx.period.end);
            }
          }
        }
        $("#visit").append(date.join(" - "));
        /* Doctor info */
        if (rx.participant && rx.participant.length>0){
          var docs = rx.participant.filter(docfilter);
          if (docs.length > 0){
            var doc = docs[0];
            var docname = getdocname(doc);
            if (docname){
              $("#doc").append(docname);
            }
          }
        } else {
            smart.patient.api.search({type: "EpisodeOfCare", query: {patient: pid}
            }).then(function(r){
              console.log(r);
              if (r.data.total > 0){
                re = r.data.entry.sort(cmpenc)[0];
                var rx = re.resource;
                console.log(rx);
                if (rx.careManager){
                  docname = getdocname(rx.careManager);
                  if (docname){
                    $("#doc").append(docname);
                  }
                }
              }
            });
        }
      }
    });
  });
}
