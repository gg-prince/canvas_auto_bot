const params = new URLSearchParams(location.search);
const intakeId = params.get("intake") || "";
const idInput = document.querySelector("#intake-id");
const form = document.querySelector("#registration-form");
const linkInput = document.querySelector("#canvas-link");
const message = document.querySelector("#form-message");
const video = document.querySelector("#tutorial-video");
const videoPlaceholder = document.querySelector("#video-placeholder");
idInput.value = intakeId;

fetch("/data/intakes.json").then(r=>r.json()).then(data=>{
  const intake=(data.intakes||[]).find(i=>i.id===intakeId);
  if(intake){
    document.querySelector("#submit-title").textContent=`Connect Canvas — ${intake.name}`;
    document.querySelector("#form-intake-label").textContent=`Intake: ${intake.name} (${intake.code})`;
  } else {
    document.querySelector("#form-intake-label").textContent="Intake not found. Please return and select an intake.";
    form.querySelector("button").disabled=true;
  }
}).catch(()=>{document.querySelector("#form-intake-label").textContent="Could not load intake information.";});

video.addEventListener("loadedmetadata",()=>{video.hidden=false;videoPlaceholder.hidden=true;});
video.addEventListener("error",()=>{video.hidden=true;videoPlaceholder.hidden=false;});
form.addEventListener("submit", async e=>{
  e.preventDefault();message.textContent="";message.className="form-message";
  const feed=linkInput.value.trim();
  if(!/^https:\/\/.+/i.test(feed)){message.textContent="Please enter a valid HTTPS Canvas calendar link.";message.classList.add("error");return;}
  const button=form.querySelector("button");button.disabled=true;button.textContent="Submitting…";
  try{
    const res=await fetch("/api/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({intakeId,feed})});
    const result=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(result.message||"Submission failed. Please try again.");
    message.textContent=result.message||"Your link was submitted successfully. Thank you!";
    message.classList.add("success");form.reset();idInput.value=intakeId;
  }catch(err){
    message.textContent=err.message||"We couldn't submit your link. Please try again.";
    message.classList.add("error");
  }finally{button.disabled=false;button.innerHTML='Submit my link <span>→</span>';}
});