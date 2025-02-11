import { LoaderFunction } from "remix";
import got from 'got-cjs'
import { html } from "remix-utils";

export const loader: LoaderFunction = async ({ request }) => {
	let { body } = await got.get(request.url.replace("api/test", "cnxt"))
	console.log(body)
	const markup = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GUN + SIA</title>
</head>

<body>

    <input id="file" type="file" accept="video/mp4,video/x-m4v,video/*">
    <video id="video" controls>
        Your browser does not support the video tag.
    </video>


</body>
<script src="https://skynet-js.hns.siasky.net/4.0-beta/index.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gun/gun.js"></script>
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script type="module">
    $(document).ready(async function () {
        var gun = Gun();
        const client = new window.skynet.SkynetClient();

        function uploadFile(e) {
            const file = e.target.files[0]
            client.uploadFile(file).then((res) => {
                gun.get('upload').put({ name: file.name, skylink: res.skylink })
            }).catch(err => {
                console.log(err)
            })

        }
        gun.get('upload').on((data) => {
            client.downloadFile(data["skylink"]).then(url => {
                $('#video').attr('src', url)
            }).catch(err => console.log(err))

        })
        const file = $("#file")
        file.on('change', uploadFile)

    })</script>

</html>`
	const markup2 = `<!DOCTYPE html>
<html>
	<head>
    <link rel="canonical" href="https://gun.eco/apps/survey.html" />
    <meta name="viewport" content="width=device-width, initial-scale=1">
	</head>
	<body>
		<div class="page" id="home">
			<!--
			Survey App requirements:
				- Create a Survey
					- Add Question
						{q: '', type: 'textarea', sort: 1, inert: false}
					- Remove Question
					- Reorder Question
				- Take a Survey
				- Review Survey
			-->
			<h1>Surveys:</h1>
			<ul class="surveys"></ul>
			<button href="create">Create</button>
			<div class="model">
				<li class="survey-summary">
					<span class="name">Title</span>
					<button>Review</button>
					<button class="modify">Modify</button>
				</li>
			</div>
		</div>
		
		<div class="page" id="create">
			Hi! Create a Survey!<br>
			<div id="survey-modify">
				What do you want to name the survey? <input class="name"/>
				<ul></ul>
			</div>
			<button class="add">Add Question</button><br><br>
			<button href="home">Done.</button><br><br>
			Link for people to take survey:<br>http://db.marknadal.com/gun/web/apps/study.html#<span class="link"></span>
			<div class="model">
				<li class="questions">
					What is the question you want to ask? <input class="q"/><br>
					What type of response do you want?<br>
					<button class="words">A few words.</button>
					<button class="essay">An essay.</button><br>
					Reorder: <button class="up">Up</button><button class="down">Down</button><br>
					<button class="del">Delete</button><br><br>
					<!--
					<button disabled="true">Multi-chocie.</button>
					-->
				</li>
			</div>
		</div>
		<!--
		<script src="https://code.jquery.com/jquery-1.11.3.min.js"></script>
		<script src="https://rawgit.com/amark/gun/master/gun.js"></script>
		-->
		<script src="../../../jquery.js"></script>
		<script src="../../db/gun.js"></script>
		<script>
			localStorage.clear();
			var gun = Gun(/*'https://gunjs.herokuapp.com/gun'*/).get('inc/survey/data').set();
			var surv = {page:{}};
			
			$('.page').not(':first').hide();
			surv.page.home = (function(){
				gun.path('surveys').map(function(survey, id){
					if(!survey){ return }
					surv.render('d' + id, survey, '.survey-summary', $('#home .surveys')).find('.modify')
						.attr('href', 'create/' + id);
				});
			}());
			surv.page.create = (function(){
				var create = {}, survey;
				create.on = function(){
					var id = ((location.hash||'').split('/')||[])[1] || Gun.text.random();
					survey = window.survey = gun.path('surveys').set().path(id).set().key('inc/survey/data/study/' + id);
					survey.val(function(survey){
						surv.render('survey-modify', survey);
					});
					survey.path('questions').map(function(q, id){
						surv.render('d' + id, q, $('#create .questions'), $('#survey-modify ul'));
					});
					$('#create').find('.link').text(id);
				}
				$('#create').find('.name').on('keyup', function(){
					if(!survey){ return }
					survey.put({name: $(this).val() });
				});
				$('#create').find('.questions').find('.q').on('keyup', function(){
					var qid = $(this).closest('.questions').attr('id').slice(1);
					if(!qid){ return }
					console.log("thee type!!", qid);
					survey.path('questions').path(qid).put({q: $(this).val()});
				});
				$('#create').find('.add').on('click', function(){
					var qid = Gun.text.random(), sort = $('#survey-modify').find('.questions').length + 1;
					// temporary work around to bug:
					//var obj = {questions: {}}; obj.questions[qid] = {q: '', type: '', sort: sort}; survey.put(obj);
					survey.path('questions').path(qid).put({q: '', type: '', sort: sort});
				});
				return create;
			}());
			
			$('a, button').on('click', function(e){
				e.preventDefault();
				surv.route($(this).attr('href'));
			});
			surv.route = function(href){
				if(!href){ return }
				var route = href.split('/')[0];
				$('.page').hide();
				$('#' + route).show();
				location.hash = href;
				(surv.page[route] || {on:function(){}}).on();
			};
			surv.route(location.hash.slice(1));
			surv.render = function(id, data, model, onto){
				var $data = $(
						$('#' + id).get(0) ||
						$('.model').find(model).clone(true).attr('id', id).appendTo(onto)
				);
				console.log("DATA", data, id);
				Gun.obj.map(data, function(val, field){
					if(Gun.obj.is(val)){ return }
					$data.find('.' + field).val(val).text(val);
				});
				return $data;
			}
		</script>		
		<style>
			.page {}
			.model {display: none}
			input {width: 100%;}
		</style>
	</body>
</html>`
	return html(body)
};

