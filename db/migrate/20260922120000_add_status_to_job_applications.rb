class AddStatusToJobApplications < ActiveRecord::Migration[7.2]
  def up
    add_column :job_applications, :status, :string, null: false, default: "interested"

    # Existing rows were all created after applying, so mark them as applied.
    execute <<~SQL.squish
      UPDATE job_applications SET status = 'applied' WHERE applied_on IS NOT NULL
    SQL
  end

  def down
    remove_column :job_applications, :status
  end
end
