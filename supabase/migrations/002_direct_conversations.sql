create or replace function public.create_direct_conversation(other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  conversation_id uuid;
  current_user_id uuid := auth.uid();
  is_connected boolean;
begin
  if current_user_id is null or other_user_id is null or current_user_id = other_user_id then
    raise exception 'Invalid conversation participants';
  end if;

  select exists (
    select 1 from public.connections c
    where c.status = 'accepted'
      and ((c.requester_id = current_user_id and c.recipient_id = other_user_id)
        or (c.requester_id = other_user_id and c.recipient_id = current_user_id))
  ) into is_connected;

  if not is_connected then
    raise exception 'Users must be accepted connections';
  end if;

  select cm.conversation_id into conversation_id
  from public.conversation_members cm
  where cm.user_id = current_user_id
    and exists (select 1 from public.conversation_members other where other.conversation_id = cm.conversation_id and other.user_id = other_user_id)
  limit 1;

  if conversation_id is null then
    insert into public.conversations default values returning id into conversation_id;
    insert into public.conversation_members(conversation_id, user_id) values (conversation_id, current_user_id), (conversation_id, other_user_id);
  end if;

  return conversation_id;
end;
$$;

grant execute on function public.create_direct_conversation(uuid) to authenticated;
