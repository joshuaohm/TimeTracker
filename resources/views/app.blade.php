@extends('layouts.app')

@section('content')
<script>
    var userId = JSON.parse("{{ json_encode($userId) }}");
</script>
<div class="container">
    <div class="row">
        <div class="col-md-8 col-md-offset-2">
            <div class="panel panel-default">

                <div class="panel-body">
                    <div id="task-window"></div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
