-- Database-level constraints mirror the API validation, as a last line of defence.
CREATE TABLE IF NOT EXISTS waitlist_entries (
  id                BIGSERIAL PRIMARY KEY,
  full_name         TEXT        NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100),
  email             TEXT        NOT NULL CHECK (char_length(email) <= 254 AND email = lower(email)),
  mobile            TEXT        NOT NULL CHECK (mobile ~ '^\+91[6-9][0-9]{9}$'),
  city              TEXT        NOT NULL
                    CHECK (city IN ('Ahmedabad','Mumbai','Delhi','Bengaluru','Pune','Other')),
  city_other        TEXT        CHECK (char_length(city_other) BETWEEN 2 AND 60),
  interests         TEXT[]      NOT NULL
                    CHECK (cardinality(interests) >= 1
                           AND interests <@ ARRAY['Music','Comedy','Food','Sports','Workshops','Theatre']),
  whatsapp_opt_in   BOOLEAN     NOT NULL DEFAULT FALSE,
  terms_accepted_at TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- "Other" city requires a city name; any listed city must not have one
  CHECK ((city = 'Other') = (city_other IS NOT NULL))
);

-- Same email or mobile can't join twice (values are normalised before insert)
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_email_uq    ON waitlist_entries (email);
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_mobile_uq   ON waitlist_entries (mobile);
-- Team view lists newest first
CREATE INDEX        IF NOT EXISTS waitlist_created_idx ON waitlist_entries (created_at DESC);
