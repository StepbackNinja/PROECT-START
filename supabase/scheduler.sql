create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
select cron.schedule('start-reminders-every-minute','* * * * *',$job$
 select net.http_post(
 url := 'https://zxuchvdfsijwwnacslcr.supabase.co/functions/v1/start-push/dispatch',
 headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (select value->>'cronSecret' from public.start_push_config where id)),
 body := '{}'::jsonb, timeout_milliseconds := 30000
 );
$job$);
create function public.start_claim_test(p_id text)
returns boolean language sql security invoker set search_path='' as $$
 with claimed as (
 update public.start_push_devices set last_test_at=now()
 where id=p_id and (last_test_at is null or last_test_at<now()-interval '30 seconds')
 returning id
 ) select exists(select 1 from claimed);
$$;
revoke all on function public.start_claim_test(text) from public,anon,authenticated;
grant execute on function public.start_claim_test(text) to service_role;
