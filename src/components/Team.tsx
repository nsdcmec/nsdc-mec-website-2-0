import React, { forwardRef, useState, useMemo } from "react";
import { FiLinkedin, FiGithub } from "react-icons/fi";
import type { TeamYear, TeamMember } from "../types";

const TeamMemberCard: React.FC<{ member: TeamMember }> = ({ member }) => (
  <div className="flex items-center p-4 border border-gray-200/80  h-full grid grid-cols-7">
    <img
      className="aspect-[3/4] w-full  object-cover flex-shrink-0 col-span-3"
      src={member.img}
      alt={member.name}
    />
    <div className="flex flex-col justify-between h-full ml-4 flex-grow col-span-4">
      <div>
        <h3 className="font-semibold text-gray-900 text-sm">{member.name}</h3>
      </div>
      <div>
        <p className="text-xs text-gray-500">{member.title}</p>
        {(member.linkedin || member.github) && (
          <div className="flex items-center gap-3 mt-2">
            {member.linkedin && (
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${member.name}'s LinkedIn Profile`}
                className="text-gray-400 hover:text-gray-800 transition-colors"
              >
                <FiLinkedin size={14} />
              </a>
            )}
            {member.github && (
              <a
                href={member.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${member.name}'s Github Profile`}
                className="text-gray-400 hover:text-gray-800 transition-colors"
              >
                <FiGithub size={14} />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
);

const Team = ({
  teams,
  teamsPreviewUrl,
}: {
  teams: TeamYear[];
  teamsPreviewUrl: string;
}) => {
  const [selectedYearId, setSelectedYearId] = useState<string>(
    teams[0]?.id || "",
  );

  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === selectedYearId),
    [teams, selectedYearId],
  );

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYearId(e.target.value);
  };

  return (
    <section className="py-16 lg:py-20 bg-white">
      <div className="  px-4 mb-8 ">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">
            Our Team
          </h2>
          <select
            value={selectedYearId}
            onChange={handleYearChange}
            className="px-3 py-2 border border-gray-300  text-sm font-semibold focus:ring-2 focus:ring-gray-800 focus:outline-none"
            aria-label="Select Team Year"
          >
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.title}
              </option>
            ))}
          </select>
        </div>

        {selectedTeam && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 ">
            {selectedTeam.members.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

Team.displayName = "Team";

export default Team;
