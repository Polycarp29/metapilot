@component('mail::message')
# You've been invited!

{{ $invitation->inviter->name }} has invited you to join **{{ $invitation->organization->name }}** on Metapilot.

@if($invitation->project)
You will be collaborating on the project: **{{ $invitation->project->name }}**.
@endif

@component('mail::button', ['url' => $url])
Accept Invitation
@endcomponent

Thanks,<br>
{{ config('app.name') }}
@endcomponent
