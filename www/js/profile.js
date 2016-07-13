function profile(smart, langdict){
  var pq = smart.patient.read();

  var outvars = {
    "name":,
    "date":"",
    "docname":"",
    "advice":""
  };

  pq.then(function(p) {
    /* Patient bio */
    var pid = p.id;
    var name = p.name[0];
    outvars["first"] = name.given.join(" ");
    outvars["last"] = name.family.join(" ");
    
    smart.patient.api.search({type: "Encounter", query: {patient: demo.patientId}
    }).then(function(r){
      if (r.data.total > 0){
        /* Want most recent visit: get its date */
        function cmpenc(a,b) {
          if (a.period & b.period){
            if (a.period.end){
              if (b.period.end){
                if (a.period.end<b.period.end){
                  return 1;
                }
                if (a.period.end>b.period.end){
                  return -1;
                }
                return 0;
              }
              return 1;
            }
            if (b.period.end){
              return -1;
            }
            if (a.period.start){
              if (b.period.start){
                if (a.period.start<b.period.start){
                  return 1;
                }
                if (a.period.start>b.period.start){
                  return -1;
                }
                return 0;
              }
              return 1;
            }
            if (b.period.start){
              return -1;
            }
          }
          return 0;
        }
        re = r.data.entry.sort(cmpenc)[0];
        var rx = re.resource;
        var date = [];
        if (rx.period){
          if (rx.period.start){
            date.push(rx.period.start);
          }
          if (rx.period.end){
            date.push(rx.period.end);
          }
        }
        outvars["date"] = date.join(" - ");
        /* Doctor info */
        if (rx.participant && rx.participant.length>0){
          function docfilter(x, i, arr){ 
            if (x.reference && x.reference.split("/")[0]=="Practitioner"){
              return true;
            }  
            return false;
          }
          var docs = rx.participant.filter(docfilter);
          if (docs.length > 0){
            var doc = docs[0];
            var docname;
            if (doc.display){
              outvars["docname"] = doc.display;
            }
            else {
              smart.patient.api.search({type: "Practitioner", query: {identifier: doc.reference.split("/")[1]}
              }).then(function(r){
                if (r.data.total > 0){
                  doc = r.data.entry[0];
                  docname = doc.name.family.join(" ");
                }
              });
            }
          }
        }
      }
    });
  });

}