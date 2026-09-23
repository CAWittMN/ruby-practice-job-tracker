# Active Record Encryption keys for at-rest secrets (e.g. stored IMAP passwords).
#
# By default the keys are derived from the app's secret_key_base, which is
# backed by config/master.key (gitignored). For a stronger production setup,
# generate dedicated keys with `bin/rails db:encryption:init` and provide them
# via the AR_ENCRYPTION_* environment variables or encrypted credentials.
Rails.application.configure do
  base = ENV["SECRET_KEY_BASE"].presence || Rails.application.secret_key_base
  enc = config.active_record.encryption

  enc.primary_key =
    ENV["AR_ENCRYPTION_PRIMARY_KEY"].presence || Digest::SHA256.hexdigest("ar-enc-primary:#{base}")
  enc.deterministic_key =
    ENV["AR_ENCRYPTION_DETERMINISTIC_KEY"].presence || Digest::SHA256.hexdigest("ar-enc-deterministic:#{base}")
  enc.key_derivation_salt =
    ENV["AR_ENCRYPTION_KEY_DERIVATION_SALT"].presence || Digest::SHA256.hexdigest("ar-enc-salt:#{base}")
end
