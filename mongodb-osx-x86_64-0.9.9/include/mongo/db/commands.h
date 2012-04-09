// commands.h

/**
*
*    This program is free software: you can redistribute it and/or  modify
*    it under the terms of the GNU Affero General Public License, version 3,
*    as published by the Free Software Foundation.
*
*    This program is distributed in the hope that it will be useful,
*    but WITHOUT ANY WARRANTY; without even the implied warranty of
*    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*    GNU Affero General Public License for more details.
*
*    You should have received a copy of the GNU Affero General Public License
*    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

#pragma once

namespace mongo {

    class BSONObj;
    class BSONObjBuilder;
    class BufBuilder;
    
// db "commands" (sent via db.$cmd.findOne(...))
// subclass to make a command.
    class Command {
    public:
        string name;

        /* run the given command
           implement this...

           fromRepl - command is being invoked as part of replication syncing.  In this situation you
                      normally do not want to log the command to the local oplog.

           return value is true if succeeded.  if false, set errmsg text.
        */
        virtual bool run(const char *ns, BSONObj& cmdObj, string& errmsg, BSONObjBuilder& result, bool fromRepl) = 0;

        /* Return true if only the admin ns has privileges to run this command. */
        virtual bool adminOnly() {
            return false;
        }

        /* Return true if slaves of a replication pair are allowed to execute the command
           (the command directly from a client -- if fromRepl, always allowed).
        */
        virtual bool slaveOk() = 0;
        
        /* Return true if the client force a command to be run on a slave by
           turning on the 'slaveok' option in the command query.
        */
        virtual bool slaveOverrideOk() {
            return false;
        }

        /* Override and return true to if true,log the operation (logOp()) to the replication log.
           (not done if fromRepl of course)

           Note if run() returns false, we do NOT log.
        */
        virtual bool logTheOp() {
            return false;
        }

        virtual void help( stringstream& help ) const;

        /* Return true if authentication and security applies to the commands.  Some commands 
           (e.g., getnonce, authenticate) can be done by anyone even unauthorized.
        */
        virtual bool requiresAuth() { return true; }

        Command(const char *_name);
        virtual ~Command() {}
    };

    bool runCommandAgainstRegistered(const char *ns, BSONObj& jsobj, BSONObjBuilder& anObjBuilder);

    bool _runCommands(const char *ns, BSONObj& jsobj, stringstream& ss, BufBuilder &b, BSONObjBuilder& anObjBuilder, bool fromRepl, int queryOptions);

} // namespace mongo
