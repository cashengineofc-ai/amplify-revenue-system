CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_email text;
BEGIN
  v_email := COALESCE(NEW.email, 'convidado+' || NEW.id::text || '@eleve.local');

  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (NEW.id, v_email,
          COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name',
                   CASE WHEN NEW.email IS NULL THEN 'Convidado' ELSE split_part(NEW.email,'@',1) END),
          NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN lower(COALESCE(NEW.email,'')) = 'okelvinempreendedor@gmail.com' THEN 'admin'::public.app_role ELSE 'user'::public.app_role END)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;